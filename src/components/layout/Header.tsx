import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'

export function Header() {
  const [isDark, setIsDark] = useState(false)

  const navItems = [
    { to: '/', label: 'AI 助手' },
    { to: '/notes', label: '笔记本' },
    { to: '/settings', label: '设置' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#16171d] border-b border-slate-200 dark:border-[#2e303a] h-14">
      <div className="flex items-center justify-between h-full px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex-shrink-0">
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">StudyMark</span>
        </div>

        {/* 导航链接 */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors',
                  'border-b-2 border-transparent',
                  isActive && 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 主题切换 */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2e303a] hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          aria-label="切换主题"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
