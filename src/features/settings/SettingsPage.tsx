import { useState, useRef } from 'react'
import { useSettingStore } from '@/stores/settingStore'
import { useChatStore } from '@/stores/chatStore'
import { useNoteStore } from '@/stores/noteStore'
import { MODEL_MAP } from '@/lib/ai/providers'
import { cn } from '@/lib/utils/cn'
import type { AIProvider } from '@/types'

const PROVIDERS: { key: AIProvider; label: string }[] = [
  { key: 'openai', label: 'OpenAI' },
  { key: 'deepseek', label: 'DeepSeek' },
  { key: 'qwen', label: '通义千问' },
]

export function SettingsPage() {
  const {
    theme,
    aiProvider,
    aiApiKey,
    aiModel,
    systemPrompt,
    setTheme,
    setAIProvider,
    setAIApiKey,
    setAIModel,
    setSystemPrompt,
  } = useSettingStore()

  const { sessions, messages: chatMessages } = useChatStore()
  const { notebooks, notes } = useNoteStore()

  const [showApiKey, setShowApiKey] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 当前 provider 可选模型列表
  const availableModels = MODEL_MAP[aiProvider] ?? {}

  // 切换 provider 时自动选择第一个模型
  const handleProviderChange = (provider: AIProvider) => {
    setAIProvider(provider)
    const models = MODEL_MAP[provider]
    if (models) {
      const firstModelKey = Object.keys(models)[0]
      setAIModel(models[firstModelKey])
    }
  }

  // 导出所有数据为 JSON
  const handleExport = () => {
    const data = {
      version: '0.1.0',
      exportedAt: new Date().toISOString(),
      settings: {
        theme,
        aiProvider,
        aiModel,
        // 不导出 apiKey
      },
      chatSessions: sessions,
      chatMessages,
      notebooks,
      notes,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `studymark-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入 JSON 数据
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        // 基本校验
        if (!data.version) {
          alert('无效的备份文件：缺少版本信息')
          return
        }

        // 恢复设置
        if (data.settings) {
          if (data.settings.theme) setTheme(data.settings.theme)
          if (data.settings.aiProvider) setAIProvider(data.settings.aiProvider)
          if (data.settings.aiModel) setAIModel(data.settings.aiModel)
        }

        // 恢复聊天数据
        if (data.chatSessions) {
          useChatStore.setState({ sessions: data.chatSessions })
        }
        if (data.chatMessages) {
          useChatStore.setState({ messages: data.chatMessages })
        }

        // 恢复笔记数据
        if (data.notebooks) {
          useNoteStore.setState({ notebooks: data.notebooks })
        }
        if (data.notes) {
          useNoteStore.setState({ notes: data.notes })
        }

        alert('数据导入成功！')
      } catch {
        alert('导入失败：文件格式不正确')
      }
    }
    reader.readAsText(file)

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 清空所有数据
  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }

    // 清空聊天数据
    useChatStore.setState({
      sessions: [],
      currentSessionId: null,
      messages: [],
      isLoading: false,
    })

    // 清空笔记数据
    useNoteStore.setState({
      notebooks: [],
      currentNotebookId: null,
      notes: [],
      currentNoteId: null,
    })

    // 重置设置（保留 theme）
    setAIProvider('deepseek')
    setAIApiKey('')
    setAIModel('deepseek-chat')

    setConfirmClear(false)
    alert('所有数据已清空')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-slate-800">设置</h1>

      {/* ========== AI 配置区域 ========== */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">AI 配置</h2>

        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
          {/* Provider 选择 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              服务商
            </label>
            <div className="flex gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleProviderChange(p.key)}
                  className={cn(
                    'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    aiProvider === p.key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* API Key 输入 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={aiApiKey}
                onChange={(e) => setAIApiKey(e.target.value)}
                placeholder="输入你的 API Key..."
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 pr-10 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                title={showApiKey ? '隐藏 API Key' : '显示 API Key'}
              >
                {showApiKey ? (
                  /* Eye-off icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  /* Eye icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              模型
            </label>
            <select
              value={aiModel}
              onChange={(e) => setAIModel(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {Object.entries(availableModels).map(([label, value]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* System Prompt */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-600">
                AI 提示词 (System Prompt)
              </label>
              <button
                onClick={() => {
                  if (confirm('确定恢复为默认提示词？')) {
                    setSystemPrompt('default')
                  }
                }}
                className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
              >
                恢复默认
              </button>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed"
              placeholder="输入自定义 System Prompt..."
            />
            <p className="mt-1.5 text-xs text-slate-400">
              提示词会作为系统消息发送给 AI，影响其回答风格和格式。修改后立即生效。
            </p>
          </div>
        </div>
      </section>

      {/* ========== 外观设置 ========== */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">外观</h2>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            主题
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                theme === 'light'
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {/* Sun icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              亮色
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                theme === 'dark'
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {/* Moon icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              暗色
            </button>
          </div>
        </div>
      </section>

      {/* ========== 数据管理 ========== */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">数据管理</h2>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          {/* 导出 */}
          <button
            onClick={handleExport}
            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium">导出所有数据</div>
              <div className="text-xs text-slate-400">将对话、笔记和设置导出为 JSON 文件</div>
            </div>
          </button>

          {/* 导入 */}
          <button
            onClick={handleImport}
            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium">导入数据</div>
              <div className="text-xs text-slate-400">从 JSON 备份文件恢复数据</div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 清空所有数据 */}
          <button
            onClick={handleClearAll}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
              confirmClear
                ? 'border-red-400 bg-red-50 text-red-700'
                : 'border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700'
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium">
                {confirmClear ? '确认清空？再次点击以确认' : '清空所有数据'}
              </div>
              <div className="text-xs text-slate-400">
                {confirmClear
                  ? '此操作不可撤销，所有对话和笔记将被永久删除'
                  : '删除所有对话、笔记和设置'}
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* ========== 关于 ========== */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">关于</h2>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </div>
            <div>
              <div className="text-base font-semibold text-slate-800">
                StudyMark - AI 学习助手
              </div>
              <div className="text-sm text-slate-500">版本 v0.1.0</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
