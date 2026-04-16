import { useEffect, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import katex from 'katex'
import { cn } from '@/lib/utils/cn'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

/**
 * 将 Markdown 内容中的 KaTeX 公式（$$...$$ 和 $...$）替换为渲染后的 HTML span。
 * 替换顺序：先处理块级公式（$$），再处理行内公式（$），避免冲突。
 */
function renderKatexFormulas(text: string): string {
  // 块级公式 $$...$$
  const blockFormulaRegex = /\$\$([\s\S]+?)\$\$/g
  // 行内公式 $...$（不跨行，且 $ 前后不能是数字，避免匹配货币符号）
  const inlineFormulaRegex = /(?<!\$)\$(?!\$)([^\$\n]+?)(?<!\$)\$(?!\$)/g

  let result = text.replace(blockFormulaRegex, (_, formula) => {
    try {
      const html = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      })
      return html
    } catch {
      return `<code class="katex-error">${formula}</code>`
    }
  })

  result = result.replace(inlineFormulaRegex, (_, formula) => {
    try {
      const html = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      })
      return html
    } catch {
      return `<code class="katex-error">${formula}</code>`
    }
  })

  return result
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const [processedContent, setProcessedContent] = useState(content)

  useEffect(() => {
    setProcessedContent(renderKatexFormulas(content))
  }, [content])

  const components = useMemo(
    () => ({
      // 自定义代码块渲染
      code(props: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
        const { children, className: codeClassName, ...rest } = props
        const match = /language-(\w+)/.exec(codeClassName || '')
        const isInline = !match && typeof children === 'string' && !children.includes('\n')

        if (isInline) {
          return (
            <code
              className="rounded bg-[var(--color-code-bg)] px-1.5 py-0.5 text-sm font-mono"
              {...rest}
            >
              {children}
            </code>
          )
        }

        return (
          <code className={codeClassName} {...rest}>
            {children}
          </code>
        )
      },
      // 自定义表格渲染
      table(props: React.HTMLAttributes<HTMLTableElement>) {
        return (
          <div className="my-4 w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm" {...props} />
          </div>
        )
      },
      // 自定义链接渲染（新标签页打开）
      a(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
        return (
          <a target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] underline hover:no-underline" {...props} />
        )
      },
      // 自定义图片渲染
      img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
        return <img className="max-w-full rounded-lg" loading="lazy" {...props} />
      },
    }),
    [],
  )

  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
