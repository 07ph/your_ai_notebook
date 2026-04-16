import { useState, useMemo, useRef } from 'react'
import { useNoteStore } from '@/stores/noteStore'
import { cn } from '@/lib/utils/cn'
import { convertMarkdownToHtml } from '@/lib/editor/markdown-to-html'

type SortOption = 'updatedAt' | 'createdAt' | 'title'

interface NoteListProps {
  onCollapse?: () => void
}

export default function NoteList({ onCollapse }: NoteListProps) {
  const {
    currentNotebookId,
    notes,
    currentNoteId,
    createNote,
    deleteNote,
    selectNote,
  } = useNoteStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 搜索过滤
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes

    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [notes, searchQuery])

  // 排序
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      switch (sortBy) {
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'title':
          return a.title.localeCompare(b.title, 'zh-CN')
        default:
          return 0
      }
    })
  }, [filteredNotes, sortBy])

  const handleCreateNote = async () => {
    if (!currentNotebookId) return
    await createNote(currentNotebookId, '无标题笔记', '', [], 'manual')
  }

  const handleDeleteNote = async (noteId: number) => {
    await deleteNote(noteId)
  }

  const handleImportMd = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentNotebookId) return

    try {
      const text = await file.text()
      const title = file.name.replace(/\.md$/, '').replace(/\.markdown$/, '').replace(/\.txt$/, '')
      // 如果是 Markdown 内容，转换为 HTML
      const content = convertMarkdownToHtml(text)
      await createNote(currentNotebookId, title, content, ['导入'], 'import')
    } catch (err) {
      console.error('导入文件失败:', err)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days} 天前`
    } else {
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  if (!currentNotebookId) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-[#16171d] text-slate-400 dark:text-slate-500">
        <p className="text-sm">请先选择一个笔记本</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d]">
      {/* 顶部操作栏 */}
      <div className="border-b border-slate-200 dark:border-[#2e303a] px-3 py-3">
        {/* 搜索框 */}
        <div className="relative mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索笔记..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#2e303a] bg-slate-50 dark:bg-[#1f2028] py-1.5 pl-8 pr-3 text-sm text-slate-800 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-[#1f2028] focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* 排序和操作 */}
        <div className="flex items-center justify-between">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-md border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] px-2 py-1 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="updatedAt">最近更新</option>
            <option value="createdAt">创建时间</option>
            <option value="title">标题排序</option>
          </select>

          <div className="flex items-center gap-1">
            {onCollapse && (
              <button
                onClick={onCollapse}
                className="flex items-center justify-center rounded-md px-1.5 py-1 text-xs text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-[#2e303a] hover:text-slate-600 dark:hover:text-slate-300"
                title="收起笔记列表"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30"
              title="新建笔记"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              新建
            </button>

            <button
              onClick={handleImportMd}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-[#2e303a]"
              title="导入 .md 文件"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              导入
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto py-1">
        {sortedNotes.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            {searchQuery ? '没有找到匹配的笔记' : '暂无笔记'}
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => selectNote(note.id!)}
              className={cn(
                'group relative cursor-pointer px-3 py-2.5 transition-colors',
                currentNoteId === note.id
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-slate-50 dark:hover:bg-[#2e303a]'
              )}
            >
              {/* 标题 */}
              <h3
                className={cn(
                  'truncate text-sm font-medium',
                  currentNoteId === note.id
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-slate-800 dark:text-slate-100'
                )}
              >
                {note.title || '无标题笔记'}
              </h3>

              {/* 标签 */}
              {note.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded bg-slate-100 dark:bg-[#2e303a] px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* 日期和字数 */}
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                <span>{formatDate(note.updatedAt)}</span>
                <span>{note.wordCount ?? 0} 字</span>
              </div>

              {/* 删除按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteNote(note.id!)
                }}
                className="absolute right-2 top-2 hidden h-5 w-5 items-center justify-center rounded text-slate-400 dark:text-slate-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 group-hover:flex"
                title="删除笔记"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
