import { useState, useRef, useEffect, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import SaveToNoteModal from '@/components/ui/SaveToNoteModal'
import { useChatStore } from '@/stores/chatStore'
import { useSettingStore } from '@/stores/settingStore'
import { getAIProvider } from '@/lib/ai/providers'
import { cn } from '@/lib/utils/cn'

export default function ChatPanel() {
  const {
    currentSessionId,
    messages: storeMessages,
    isLoading,
    createSession,
    addMessage,
    setLoading,
  } = useChatStore()

  const { aiProvider, aiApiKey, aiModel, systemPrompt } = useSettingStore()

  const [input, setInput] = useState('')
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveContent, setSaveContent] = useState('')
  const [saveTitle, setSaveTitle] = useState('')
  const [saveTags, setSaveTags] = useState<string[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const userScrolledUpRef = useRef(false)

  // 智能滚动：只有用户在底部时才自动滚动
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    // 检查用户是否滚动到了非底部位置
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // 距离底部超过 100px 认为是"向上滚动"
      userScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 100
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // 只有用户没有向上滚动时才自动滚动
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [storeMessages, streamingContent])

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // 如果没有当前会话，创建一个
  const ensureSession = useCallback(async () => {
    if (!currentSessionId) {
      return await createSession()
    }
    return currentSessionId
  }, [currentSessionId, createSession])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = input.trim()
    if ((!trimmed && !imagePreview) || isLoading) return

    if (!aiApiKey) {
      alert('请先在设置中配置 AI API Key')
      return
    }

    const sessionId = await ensureSession()

    // 添加用户消息到 store
    addMessage({
      sessionId,
      role: 'user',
      content: imagePreview ? `${trimmed}\n[已上传图片]`.trim() : trimmed,
      tokenCount: 0,
      model: aiModel,
    })

    // 保存当前图片数据（发送后清除）
    const currentImage = imagePreview
    setInput('')
    setLoading(true)
    setStreamingContent('')

    // 检查当前模型是否支持图片
    const visionUnsupportedModels = ['deepseek-chat', 'qwen-max', 'qwen-plus', 'qwen-turbo', 'gpt-4o-mini']
    if (currentImage && visionUnsupportedModels.includes(aiModel)) {
      alert(`当前模型 ${aiModel} 不支持图片输入。\n\n千问用户请选择「千问 VL Max」或「千问 VL Plus」。\nOpenAI 用户请选择「GPT-4o」。`)
      setInput(trimmed)
      setLoading(false)
      return
    }

    try {
      const provider = getAIProvider(aiProvider, aiApiKey)
      provider(aiModel)

      // 构建消息历史
      const historyMessages = storeMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      // 构建最后一条用户消息（支持多模态格式）
      const lastUserMessage = currentImage
        ? {
            role: 'user' as const,
            content: [
              { type: 'text' as const, text: trimmed || '' },
              { type: 'image_url' as const, image_url: { url: currentImage } },
            ],
          }
        : { role: 'user' as const, content: trimmed }

      const allMessages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...historyMessages,
        lastUserMessage,
      ]

      // 使用 fetch 调用 AI API（兼容 OpenAI 格式）
      let baseURL = ''
      let headers: Record<string, string> = {}

      if (aiProvider === 'openai') {
        baseURL = 'https://api.openai.com/v1/chat/completions'
        headers = {
          'Authorization': `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json',
        }
      } else if (aiProvider === 'deepseek') {
        baseURL = 'https://api.deepseek.com/v1/chat/completions'
        headers = {
          'Authorization': `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json',
        }
      } else if (aiProvider === 'qwen') {
        baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
        headers = {
          'Authorization': `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json',
        }
      }

      abortControllerRef.current = new AbortController()

      const response = await fetch(baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: aiModel,
          messages: allMessages,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error?.message || errorData.error || errorData.message || `API 请求失败 (${response.status})`
        throw new Error(errorMsg)
      }

      // 读取 SSE 流
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue

          const data = trimmedLine.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              setStreamingContent(fullContent)
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      // 流式完成后添加到 store
      if (fullContent) {
        await addMessage({
          sessionId,
          role: 'assistant',
          content: fullContent,
          tokenCount: 0,
          model: aiModel,
        })
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户手动取消，不报错
      } else {
        console.error('发送消息失败:', err)
        const errorMessage = err instanceof Error ? err.message : '未知错误'
        // 将错误显示为 AI 消息，而不是 alert
        const errorSessionId = currentSessionId || await createSession()
        await addMessage({
          sessionId: errorSessionId,
          role: 'assistant',
          content: `⚠️ **请求失败**：${errorMessage}\n\n请检查：\n1. API Key 是否正确\n2. API Key 是否已过期\n3. 网络连接是否正常\n\n前往 [设置](#/settings) 修改 API Key。`,
          tokenCount: 0,
          model: aiModel,
        })
      }
    } finally {
      setStreamingContent('')
      setLoading(false)
      setImagePreview(null) // 发送完成（成功或失败）后清除图片预览
      abortControllerRef.current = null
    }
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) continue
        if (file.size > 10 * 1024 * 1024) {
          alert('图片大小不能超过 10MB')
          return
        }
        const reader = new FileReader()
        reader.onload = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
        return
      }
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const handleSaveToNote = (content: string) => {
    setSaveContent(content)
    // 智能提取标题：优先找 # 开头的标题行，没有则取第一行，截取前 50 字
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
    const headingLine = lines.find(l => /^#{1,3}\s/.test(l))
    let title = ''
    if (headingLine) {
      title = headingLine.replace(/^#{1,3}\s*/, '').trim()
    } else {
      // 取第一行纯文本，去掉 Markdown 符号
      title = lines[0]
        ?.replace(/[*_`~\[\]]/g, '')
        .replace(/\$\$[\s\S]*?\$\$/g, '[公式]')
        .replace(/\$[^$]+\$/g, '[公式]')
        .trim() || 'AI 学习笔记'
    }
    setSaveTitle(title.slice(0, 50))

    // 智能提取标签
    const tags = extractTags(content)
    setSaveTags(tags)

    setSaveModalOpen(true)
  }

  /**
   * 从内容中智能提取标签
   */
  function extractTags(content: string): string[] {
    const tags: string[] = []
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)

    // 1. 从标题提取关键词（去掉虚词）
    const headingLine = lines.find(l => /^#{1,3}\s/.test(l))
    if (headingLine) {
      const headingText = headingLine.replace(/^#{1,3}\s*/, '').trim()
      // 按常见分隔符拆分
      const keywords = headingText.split(/[-|、，,：:（()）]/).map(w => w.trim()).filter(w => w.length >= 2 && w.length <= 8)
      tags.push(...keywords.slice(0, 2))
    }

    // 2. 检测内容特征，自动添加学科标签
    const featureTags: string[] = []
    if (/\$[^$]+\$/.test(content) || /\$\$[\s\S]+?\$\$/.test(content)) featureTags.push('公式')
    if (/```[\s\S]*?```/.test(content)) featureTags.push('代码')
    if (/^\|.*\|$/m.test(content)) featureTags.push('表格')
    if (/^\d+\.\s/m.test(content) && /^\d+\.\s/m.test(content.slice(0, 500))) featureTags.push('总结')
    if (/\b证明\b|\b定理\b|\b定义\b|\b公理\b/.test(content)) featureTags.push('数学')
    if (/\b函数\b|\b导数\b|\b积分\b|\b极限\b|\b微分\b/.test(content)) featureTags.push('微积分')
    if (/\b矩阵\b|\b向量\b|\b线性\b/.test(content)) featureTags.push('线性代数')
    if (/\b概率\b|\b统计\b|\b分布\b|\b期望\b/.test(content)) featureTags.push('概率统计')
    if (/\bclass\b|\bdef\b|\bfunction\b|\bimport\b/.test(content)) featureTags.push('编程')
    if (/\b物理\b|\b力学\b|\b电磁\b|\b光学\b/.test(content)) featureTags.push('物理')
    if (/\b化学\b|\b反应\b|\b分子\b|\b方程式\b/.test(content)) featureTags.push('化学')
    tags.push(...featureTags)

    // 3. 添加 AI 生成标记
    tags.push('AI')

    // 去重，最多 5 个
    return [...new Set(tags)].slice(0, 5)
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 限制大小 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB')
      return
    }

    // 转为 base64 并预览
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = () => {
    setImagePreview(null)
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-[#16171d]">
      {/* 消息列表区域 */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
        {storeMessages.length === 0 && !streamingContent ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="mb-4 text-5xl">💬</div>
            <p className="text-lg font-medium">开始新的对话</p>
            <p className="mt-1 text-sm">输入你的问题，AI 将为你解答</p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {storeMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSaveToNote={
                  message.role === 'assistant' ? handleSaveToNote : undefined
                }
              />
            ))}

            {/* 流式消息展示 */}
            {streamingContent && (
              <MessageBubble
                key="streaming"
                message={{
                  id: -1,
                  sessionId: currentSessionId ?? 0,
                  role: 'assistant',
                  content: streamingContent,
                  tokenCount: 0,
                  model: aiModel,
                  createdAt: new Date(),
                }}
              />
            )}

            {/* 加载指示器 */}
            {isLoading && !streamingContent && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-500 text-sm font-medium text-white">
                  AI
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 底部输入区域 */}
      <div className="border-t border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d] px-4 py-3">
        {/* 图片预览 */}
        {imagePreview && (
          <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2">
            <div className="relative">
              <img src={imagePreview} alt="上传的图片" className="h-20 w-20 rounded-lg object-cover border border-slate-200 dark:border-[#2e303a]" />
              <button
                onClick={removeImage}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white text-xs hover:bg-slate-900"
              >
                ×
              </button>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">图片已添加，发送时将一同提交</span>
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          {/* 图片上传按钮 */}
          <button
            type="button"
            onClick={handleImageUpload}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-[#2e303a] hover:text-slate-600 dark:hover:text-slate-300"
            title="上传图片"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </button>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* 输入框 */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="输入消息... (Shift+Enter 换行，可粘贴图片)"
              rows={1}
              className="max-h-[200px] min-h-[40px] w-full resize-none rounded-xl border border-slate-200 dark:border-[#2e303a] bg-slate-50 dark:bg-[#1f2028] px-4 py-2.5 pr-12 text-sm text-slate-800 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-[#1f2028] focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 发送按钮 */}
          <button
            type="submit"
            disabled={(!input.trim() && !imagePreview) || isLoading}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
              (input.trim() || imagePreview) && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'cursor-not-allowed bg-slate-100 dark:bg-[#2e303a] text-slate-400 dark:text-slate-500'
            )}
            title="发送"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>

        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-400 dark:text-slate-500">
          当前模型：{aiModel} | {aiProvider === 'qwen' ? '通义千问' : aiProvider === 'deepseek' ? 'DeepSeek' : 'OpenAI'}
        </p>
      </div>

      {/* 保存到笔记弹窗 */}
      <SaveToNoteModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        defaultContent={saveContent}
        defaultTitle={saveTitle}
        defaultTags={saveTags}
      />
    </div>
  )
}
