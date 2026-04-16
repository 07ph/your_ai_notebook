import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import ChatPanel from '@/components/ai-chat/ChatPanel'
import { useChatStore } from '@/stores/chatStore'

export function AIChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const init = useChatStore((s) => s.init)

  useEffect(() => { init() }, [init])

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* 左侧 Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0 overflow-hidden' : 'hidden md:block'}`}>
        <Sidebar onCollapse={() => setSidebarCollapsed(true)} />
      </div>

      {/* 折叠后的展开按钮 */}
      {sidebarCollapsed && (
        <div className="hidden md:flex items-start pt-3">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="展开对话列表"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* 右侧 ChatPanel */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  )
}
