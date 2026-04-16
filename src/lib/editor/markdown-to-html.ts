import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeHighlight from 'rehype-highlight'

interface FormulaPlaceholder {
  id: string
  formula: string
  displayMode: boolean
}

let placeholderCounter = 0

/**
 * 将 Markdown 转换为 HTML（含数学公式节点）
 * 公式使用 @tiptap/extension-mathematics 的节点格式：
 *   行内：<span data-type="inline-math" data-latex="..."></span>
 *   块级：<div data-type="block-math" data-latex="..."></div>
 */
export function convertMarkdownToHtml(md: string): string {
  const formulas: FormulaPlaceholder[] = []
  placeholderCounter = 0

  // 第一步：提取块级公式 $$...$$
  let processed = md.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    const id = `MATHBLOCK${placeholderCounter++}ENDMATHBLOCK`
    formulas.push({ id, formula: formula.trim(), displayMode: true })
    return `\n\n${id}\n\n`
  })

  // 第二步：提取行内公式 $...$（不匹配 $$）
  processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_match, formula) => {
    const id = `MATHINLINE${placeholderCounter++}ENDMATHINLINE`
    formulas.push({ id, formula: formula.trim(), displayMode: false })
    return id
  })

  // 第三步：Markdown → HTML
  const htmlResult = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .processSync(processed)
    .toString()

  // 第四步：将占位符替换为 Tiptap Mathematics 扩展的节点格式
  let finalHtml = htmlResult
  for (const { id, formula, displayMode } of formulas) {
    // 转义 HTML 特殊字符（公式内容在 data-latex 属性中）
    const escapedFormula = formula
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    if (displayMode) {
      // 块级公式
      const mathHtml = `<div data-type="block-math" data-latex="${escapedFormula}"></div>`
      finalHtml = finalHtml.replace(`<p>${id}</p>`, mathHtml)
      if (finalHtml.includes(id)) {
        finalHtml = finalHtml.replace(id, mathHtml)
      }
    } else {
      // 行内公式
      const mathHtml = `<span data-type="inline-math" data-latex="${escapedFormula}"></span>`
      finalHtml = finalHtml.replace(id, mathHtml)
    }
  }

  return finalHtml
}

/**
 * 检测内容是否是纯 Markdown（未转换的）
 */
export function isMarkdownContent(content: string): boolean {
  if (!content) return false
  if (content.trim().startsWith('<')) return false
  const mdPatterns = [
    /^#{1,6}\s/m,
    /\*\*[^*]+\*\*/,
    /\$[^$]+\$/,
    /\$\$[\s\S]+?\$\$/,
    /^[-*+]\s/m,
    /^\d+\.\s/m,
    /^```/m,
    /^\|.*\|$/m,
  ]
  return mdPatterns.some(pattern => pattern.test(content))
}
