import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { useChatStore } from '@/stores/chatStore'

interface SidebarProps {
  onCollapse?: () => void
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const { sessions, currentSessionId, createSession, switchSession, deleteSession, renameSession } = useChatStore()
  const [search, setSearch] = useState('')
  const [contextMenuId, setContextMenuId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renameId, setRenameId] = useState<number | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const createInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

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

  // 创建时自动聚焦
  useEffect(() => {
    if (isCreating && createInputRef.current) createInputRef.current.focus()
  }, [isCreating])

  // 重命名时自动聚焦
  useEffect(() => {
    if (isRenaming && renameInputRef.current) renameInputRef.current.focus()
  }, [isRenaming])

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todaySessions = filteredSessions.filter((s) => new Date(s.createdAt) >= today)
  const yesterdaySessions = filteredSessions.filter((s) => {
    const d = new Date(s.createdAt)
    return d >= yesterday && d < today
  })
  const olderSessions = filteredSessions.filter((s) => new Date(s.createdAt) < yesterday)

  // 新建对话
  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    await createSession(title)
    setNewTitle('')
    setIsCreating(false)
  }

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    else if (e.key === 'Escape') { setIsCreating(false); setNewTitle('') }
  }

  // 重命名
  const handleRename = async () => {
    const title = renameValue.trim()
    if (!title || !renameId) return
    await renameSession(renameId, title)
    setIsRenaming(false)
    setRenameId(null)
    setRenameValue('')
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRename()
    else if (e.key === 'Escape') { setIsRenaming(false); setRenameId(null); setRenameValue('') }
  }

  // 删除
  const handleDelete = async (id: number) => {
    await deleteSession(id)
    setContextMenuId(null)
  }

  // 格式化时间
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderGroup = (label: string, items: typeof sessions) => {
    if (items.length === 0) return null
    return (
      <div className="mb-3">
        <h3 className="px-3 py-1 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {label}
        </h3>
        <ul className="space-y-0.5">
          {items.map((session) => (
            <li key={session.id} className="relative">
              {/* 重命名输入框 */}
              {isRenaming && renameId === session.id ? (
                <div className="px-2 py-1.5">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleRename}
                    className="w-full px-2 py-1 text-sm bg-white dark:bg-[#1f2028] border border-blue-500 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              ) : (
                <button
                  onClick={() => switchSession(session.id!)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setContextMenuId(contextMenuId === session.id ? null : session.id!)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg truncate transition-colors',
                    session.id === currentSessionId
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2e303a]'
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-sm font-medium">{session.title}</span>
                    {/* 更多操作按钮 */}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        setContextMenuId(contextMenuId === session.id ? null : session.id!)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          setContextMenuId(contextMenuId === session.id ? null : session.id!)
                        }
                      }}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-[#2e303a] hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      style={{ opacity: contextMenuId === session.id ? 1 : undefined }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </span>
                  </div>
                  {/* 创建时间小字 */}
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {formatTime(session.createdAt)}
                  </div>
                </button>
              )}

              {/* 右键/更多菜单 */}
              {contextMenuId === session.id && (
                <div
                  ref={contextMenuRef}
                  className="absolute right-2 top-8 z-20 w-32 rounded-lg border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] py-1 shadow-lg"
                >
                  <button
                    onClick={() => {
                      setRenameId(session.id!)
                      setRenameValue(session.title)
                      setIsRenaming(true)
                      setContextMenuId(null)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#2e303a]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    重命名
                  </button>
                  <button
                    onClick={() => handleDelete(session.id!)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    删除对话
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <aside className="w-64 h-full bg-slate-50 dark:bg-[#16171d] border-r border-slate-200 dark:border-[#2e303a] flex flex-col">
      {/* 顶部：新建对话 + 折叠按钮 */}
      <div className="flex items-center gap-2 p-3">
        {isCreating ? (
          <input
            ref={createInputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleCreateKeyDown}
            onBlur={() => { if (!newTitle.trim()) { setIsCreating(false); setNewTitle('') } }}
            placeholder="对话名称..."
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#1f2028] border border-blue-500 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 新建对话
          </button>
        )}
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-[#2e303a] hover:text-slate-600 dark:hover:text-slate-300"
            title="收起对话列表"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* 搜索框 */}
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="搜索对话..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#1f2028] border border-slate-200 dark:border-[#2e303a] rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {renderGroup('今天', todaySessions)}
        {renderGroup('昨天', yesterdaySessions)}
        {renderGroup('更早', olderSessions)}

        {filteredSessions.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {search ? '没有找到匹配的对话' : '暂无对话'}
          </div>
        )}
      </div>
    </aside>
  )
}
