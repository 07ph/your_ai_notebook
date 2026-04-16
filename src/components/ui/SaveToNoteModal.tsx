import { useState } from 'react'
import { useNoteStore } from '@/stores/noteStore'
import { convertMarkdownToHtml, isMarkdownContent } from '@/lib/editor/markdown-to-html'
import { cn } from '@/lib/utils/cn'

interface SaveToNoteModalProps {
  open: boolean
  onClose: () => void
  defaultContent: string
  defaultTitle?: string
  defaultTags?: string[]
}

export default function SaveToNoteModal({
  open,
  onClose,
  defaultContent,
  defaultTitle,
  defaultTags,
}: SaveToNoteModalProps) {
  const { notebooks, createNote } = useNoteStore()
  const [selectedNotebookId, setSelectedNotebookId] = useState<number | null>(
    notebooks.length > 0 ? notebooks[0].id ?? null : null
  )
  const [title, setTitle] = useState(defaultTitle || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(defaultTags || [])
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = async () => {
    if (!selectedNotebookId || !title.trim()) return

    setSaving(true)
    try {
      // 如果内容是 Markdown，转换为 HTML（公式、表格等才能正确渲染）
      const finalContent = isMarkdownContent(defaultContent)
        ? convertMarkdownToHtml(defaultContent)
        : defaultContent

      // 通过 store 创建笔记（自动写入数据库并刷新列表）
      await createNote(selectedNotebookId, title.trim(), finalContent, tags, 'ai')
      onClose()
    } catch (err) {
      console.error('保存到笔记失败:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d] p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
          保存到笔记
        </h3>

        {/* 选择笔记本 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            目标笔记本
          </label>
          <select
            value={selectedNotebookId ?? ''}
            onChange={(e) => setSelectedNotebookId(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {notebooks.length === 0 && (
              <option value="" disabled>
                暂无笔记本
              </option>
            )}
            {notebooks.map((nb) => (
              <option key={nb.id} value={nb.id}>
                {nb.icon ? `${nb.icon} ` : ''}{nb.name}
              </option>
            ))}
          </select>
        </div>

        {/* 标题 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入笔记标题..."
            className="w-full rounded-lg border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* 标签 */}
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            标签
          </label>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] px-2 py-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  &times;
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? '输入标签后按回车...' : ''}
              className="min-w-[80px] flex-1 border-none bg-transparent py-0.5 text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-[#2e303a]"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedNotebookId || !title.trim() || saving}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
              selectedNotebookId && title.trim() && !saving
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'cursor-not-allowed bg-slate-300 dark:bg-slate-600'
            )}
          >
            {saving ? '保存中...' : '确认保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
