import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import katex from 'katex'
import type { ChatMessage } from '@/types'
import { cn } from '@/lib/utils/cn'

interface MessageBubbleProps {
  message: ChatMessage
  onSaveToNote?: (content: string) => void
}

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 预处理 Markdown 内容：将 $...$ 和 $$...$$ 公式替换为 KaTeX 渲染的 HTML
 */
function renderMathInMarkdown(content: string): string {
  let result = content

  // 块级公式 $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    try {
      const html = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      })
      return `<div class="math-block-display">${html}</div>`
    } catch {
      return `<div class="math-block-display" style="color:red">${formula}</div>`
    }
  })

  // 行内公式 $...$（不匹配 $$）
  result = result.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_match, formula) => {
    try {
      const html = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        output: 'html',
      })
      return html
    } catch {
      return `<span style="color:red">${formula}</span>`
    }
  })

  return result
}

export default function MessageBubble({ message, onSaveToNote }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  // 预处理：渲染公式
  const renderedContent = useMemo(() => {
    if (isUser) return message.content
    return renderMathInMarkdown(message.content)
  }, [message.content, isUser])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = message.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white',
          isUser ? 'bg-blue-600' : 'bg-slate-500'
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* 消息内容 */}
      <div className={cn('flex max-w-[75%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-blue-600 text-white'
              : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="ai-message-content prose prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-headings:text-slate-900 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:my-2 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50/50 prose-a:text-blue-600 prose-strong:text-slate-900 prose-table:text-sm prose-th:bg-slate-50">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
              >
                {renderedContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* 底部信息栏 */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-slate-400">
            {formatTime(message.createdAt)}
          </span>

          {!isUser && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="rounded px-1.5 py-0.5 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title="复制"
              >
                {copied ? '已复制' : '复制'}
              </button>

              {onSaveToNote && (
                <button
                  onClick={() => onSaveToNote(message.content)}
                  className="rounded px-1.5 py-0.5 text-xs text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  title="保存到笔记"
                >
                  保存到笔记
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
