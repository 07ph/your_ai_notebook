import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { to: '/', label: 'AI 助手', icon: '💬' },
  { to: '/notes', label: '笔记本', icon: '📓' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs transition-colors',
                isActive ? 'text-blue-600' : 'text-slate-400'
              )
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
