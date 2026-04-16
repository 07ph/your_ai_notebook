import { useState, useEffect } from 'react'
import NotebookSidebar from '@/components/notes/NotebookSidebar'
import NoteList from '@/components/notes/NoteList'
import NoteEditor from '@/components/notes/NoteEditor'
import { useNoteStore } from '@/stores/noteStore'

export function NotesPage() {
  const { init } = useNoteStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [noteListCollapsed, setNoteListCollapsed] = useState(false)

  useEffect(() => { init() }, [init])

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* 左侧 - 笔记本列表 */}
      <div className={`${sidebarCollapsed ? 'w-0 overflow-hidden' : 'hidden md:flex'}`}>
        <NotebookSidebar onCollapse={() => setSidebarCollapsed(true)} />
      </div>

      {/* 笔记本折叠后的展开按钮 */}
      {sidebarCollapsed && (
        <div className="hidden md:flex items-start pt-3">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="展开笔记本"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* 中间 - 笔记列表 */}
      <div className={`${noteListCollapsed ? 'w-0 overflow-hidden' : 'hidden md:flex'}`}>
        <NoteList onCollapse={() => setNoteListCollapsed(true)} />
      </div>

      {/* 笔记列表折叠后的展开按钮 */}
      {noteListCollapsed && (
        <div className="hidden md:flex items-start pt-3">
          <button
            onClick={() => setNoteListCollapsed(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="展开笔记列表"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* 右侧 - 笔记编辑器 */}
      <div className="flex-1 overflow-hidden">
        <NoteEditor />
      </div>
    </div>
  )
}
