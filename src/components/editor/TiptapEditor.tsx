import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Mathematics } from '@tiptap/extension-mathematics'
import { common, createLowlight } from 'lowlight'
import { DOMParser } from 'prosemirror-model'
import { useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { convertMarkdownToHtml } from '@/lib/editor/markdown-to-html'
import 'katex/dist/katex.min.css'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export default function TiptapEditor({ content, onChange, placeholder = '开始编写...', className, editable = true }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      Image.configure({ inline: true, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      CodeBlockLowlight.configure({ lowlight }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
        inlineOptions: {
          onClick: (node, pos) => {
            if (!editor) return
            const newFormula = prompt('编辑公式:', node.attrs.latex)
            if (newFormula) {
              editor.chain().setNodeSelection(pos).updateInlineMath({ latex: newFormula }).focus().run()
            }
          },
        },
        blockOptions: {
          onClick: (node, pos) => {
            if (!editor) return
            const newFormula = prompt('编辑公式:', node.attrs.latex)
            if (newFormula) {
              editor.chain().setNodeSelection(pos).updateBlockMath({ latex: newFormula }).focus().run()
            }
          },
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')
        if (!text) return false

        // 检测是否包含 Markdown 公式语法
        const hasMath = /\$\$[\s\S]+?\$\$/.test(text) || /\$[^$]+\$/.test(text)
        const hasMarkdown = /^#{1,6}\s/m.test(text) || /^\|.*\|$/m.test(text)

        if (hasMath || hasMarkdown) {
          event.preventDefault()
          try {
            const html = convertMarkdownToHtml(text)
            const dom = document.createElement('div')
            dom.innerHTML = html
            const parser = DOMParser.fromSchema(view.state.schema)
            const slice = parser.parseSlice(dom)
            const tr = view.state.tr.replaceSelection(slice)
            view.dispatch(tr)
            return true
          } catch (e) {
            console.error('粘贴转换失败:', e)
          }
          return false
        }

        return false
      },
    },
  })

  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentContent = editor.getHTML()
      if (content !== currentContent) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  // 插入公式
  const insertMath = useCallback((displayMode: boolean) => {
    if (!editor) return
    const formula = prompt(displayMode ? '输入块级公式 (LaTeX):' : '输入行内公式 (LaTeX):')
    if (!formula) return

    if (displayMode) {
      editor.chain().focus().insertBlockMath({ latex: formula }).run()
    } else {
      editor.chain().focus().insertInlineMath({ latex: formula }).run()
    }
  }, [editor])

  // 插入图片
  const addImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        editor?.chain().focus().setImage({ src: reader.result as string }).run()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [editor])

  if (!editor) return null

  const ToolbarButton = ({ onClick, isActive, children, title }: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
        isActive && 'bg-blue-50 text-blue-600'
      )}
    >
      {children}
    </button>
  )

  return (
    <div className={cn('flex h-full flex-col border border-slate-200 rounded-lg overflow-hidden', className)}>
      {/* 简化工具栏 */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/80 px-2 py-1.5">
          {/* 标题 */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="一级标题">
            <span className="text-xs font-bold">H1</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="二级标题">
            <span className="text-xs font-bold">H2</span>
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-slate-200" />

          {/* 格式 */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="加粗">
            <span className="text-sm font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="斜体">
            <span className="text-sm italic">I</span>
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-slate-200" />

          {/* 列表 */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="无序列表">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-slate-200" />

          {/* 公式 */}
          <ToolbarButton onClick={() => insertMath(false)} title="行内公式 ($...$)">
            <span className="text-xs font-mono">$x$</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => insertMath(true)} title="块级公式 ($$...$$)">
            <span className="text-xs font-mono">∑</span>
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-slate-200" />

          {/* 代码 */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="代码块">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </ToolbarButton>

          {/* 图片 */}
          <ToolbarButton onClick={addImage} title="插入图片">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </ToolbarButton>

          {/* 引用 */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="引用">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </ToolbarButton>
        </div>
      )}

      {/* 编辑器主体 */}
      <div className="flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
