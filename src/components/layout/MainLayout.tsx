import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileNav } from './MobileNav'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#16171d]">
      <Header />
      <main className="pt-14 pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
