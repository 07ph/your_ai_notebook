import { useState, useRef, useEffect } from 'react'
import { useNoteStore } from '@/stores/noteStore'
import { cn } from '@/lib/utils/cn'

interface NotebookSidebarProps {
  onCollapse?: () => void
}

export default function NotebookSidebar({ onCollapse }: NotebookSidebarProps) {
  const {
    notebooks,
    currentNotebookId,
    createNotebook,
    deleteNotebook,
    selectNotebook,
  } = useNoteStore()

  const [contextMenuId, setContextMenuId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 点击外部关闭上下文菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 创建笔记本时自动聚焦输入框
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return

    try {
      const id = await createNotebook(name, '')
      // 创建后自动选中
      await selectNotebook(id)
    } catch (err) {
      console.error('创建笔记本失败:', err)
    }

    setNewName('')
    setIsCreating(false)
  }

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate()
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewName('')
    }
  }

  const handleDelete = async (notebookId: number) => {
    try {
      await deleteNotebook(notebookId)
    } catch (err) {
      console.error('删除笔记本失败:', err)
    }
    setContextMenuId(null)
  }

  const handleContextMenu = (e: React.MouseEvent, notebookId: number) => {
    e.preventDefault()
    setContextMenuId(contextMenuId === notebookId ? null : notebookId)
  }

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d]">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2e303a] px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">笔记本</h2>
        <div className="flex items-center gap-1">
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-[#2e303a] hover:text-slate-600 dark:hover:text-slate-300"
              title="收起笔记本"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-[#2e303a] hover:text-blue-600 dark:hover:text-blue-400"
            title="新建笔记本"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* 笔记本列表 */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* 新建笔记本输入框 */}
        {isCreating && (
          <div className="px-2 py-1">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              onBlur={() => {
                if (!newName.trim()) {
                  setIsCreating(false)
                }
              }}
              placeholder="笔记本名称..."
              className="w-full rounded-lg border border-blue-500 bg-white dark:bg-[#1f2028] px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        )}

        {notebooks.map((notebook) => (
          <div key={notebook.id} className="relative">
            <div
              onClick={() => selectNotebook(notebook.id!)}
              onContextMenu={(e) => handleContextMenu(e, notebook.id!)}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors cursor-pointer',
                currentNotebookId === notebook.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2e303a]'
              )}
            >
              {/* 图标 */}
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-[#2e303a] text-xs">
                {notebook.icon || notebook.name.charAt(0)}
              </span>

              {/* 名称和数量 */}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{notebook.name}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {notebook.noteCount ?? 0} 篇笔记
                </span>
              </div>

              {/* 更多操作按钮 */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  setContextMenuId(contextMenuId === notebook.id ? null : notebook.id!)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    setContextMenuId(contextMenuId === notebook.id ? null : notebook.id!)
                  }
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 dark:text-slate-500 opacity-0 transition-all hover:bg-slate-200 dark:hover:bg-[#2e303a] group-hover:opacity-100 cursor-pointer"
                style={{ opacity: contextMenuId === notebook.id ? 1 : undefined }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </span>
            </div>

            {/* 上下文菜单 */}
            {contextMenuId === notebook.id && (
              <div
                ref={contextMenuRef}
                className="absolute right-2 top-8 z-20 w-32 rounded-lg border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] py-1 shadow-lg"
              >
                <button
                  onClick={() => handleDelete(notebook.id!)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  删除笔记本
                </button>
              </div>
            )}
          </div>
        ))}

        {notebooks.length === 0 && !isCreating && (
          <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            暂无笔记本
            <br />
            点击上方 + 创建
          </div>
        )}
      </div>
    </div>
  )
}
