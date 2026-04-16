import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { AIChatPage } from './features/ai-assist/AIChatPage'
import { NotesPage } from './features/notes/NotesPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { useSettingStore } from './stores/settingStore'

function App() {
  const theme = useSettingStore((s) => s.theme)

  // 同步主题到 <html> 的 class
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<AIChatPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
