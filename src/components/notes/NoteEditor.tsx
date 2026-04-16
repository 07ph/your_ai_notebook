import { useState, useEffect, useRef, useCallback } from 'react'
import { useNoteStore } from '@/stores/noteStore'
import { updateNote as updateNoteDB } from '@/lib/db/queries'
import { convertMarkdownToHtml, isMarkdownContent } from '@/lib/editor/markdown-to-html'
import TiptapEditor from '@/components/editor/TiptapEditor'

export default function NoteEditor() {
  const {
    notes,
    currentNoteId,
    updateNote,
  } = useNoteStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // 当前笔记
  const currentNote = notes.find((n) => n.id === currentNoteId)

  // 当切换笔记时，加载笔记数据
  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title)
      // 检测是否是未转换的 Markdown，如果是则转换为 HTML
      const noteContent = currentNote.content
      if (isMarkdownContent(noteContent)) {
        const html = convertMarkdownToHtml(noteContent)
        setContent(html)
        // 同时更新数据库中的内容为 HTML
        if (currentNote.id) {
          updateNoteDB(currentNote.id, { content: html, wordCount: html.replace(/<[^>]*>/g, '').length })
        }
      } else {
        setContent(noteContent)
      }
      setTags(currentNote.tags || [])
    } else {
      setTitle('')
      setContent('')
      setTags([])
    }
  }, [currentNoteId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 自动保存（debounce 1秒）
  const debouncedSave = useCallback(
    (noteId: number, updates: { title: string; content: string; tags: string[] }) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = setTimeout(async () => {
        try {
          await updateNoteDB(noteId, {
            title: updates.title,
            content: updates.content,
            tags: updates.tags,
            wordCount: updates.content.replace(/<[^>]*>/g, '').length,
          })
          updateNote(noteId, {
            title: updates.title,
            content: updates.content,
          })
        } catch (err) {
          console.error('自动保存失败:', err)
        }
      }, 1000)
    },
    [updateNote]
  )

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (currentNoteId) {
      debouncedSave(currentNoteId, { title: newTitle, content, tags })
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    if (currentNoteId) {
      debouncedSave(currentNoteId, { title, content: newContent, tags })
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag]
      setTags(newTags)
      setTagInput('')
      if (currentNoteId) {
        debouncedSave(currentNoteId, { title, content, tags: newTags })
      }
    }
  }

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag)
    setTags(newTags)
    if (currentNoteId) {
      debouncedSave(currentNoteId, { title, content, tags: newTags })
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // 没有选中笔记时显示空状态
  if (!currentNoteId || !currentNote) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50 text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mb-3 h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <p className="text-sm">选择一篇笔记开始编辑</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 顶部工具栏 */}
      <div className="border-b border-slate-200 px-6 py-3">
        {/* 标题 */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="笔记标题..."
          className="mb-2 w-full text-xl font-semibold text-slate-800 outline-none placeholder:text-slate-300"
        />

        {/* 标签输入区域 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-0.5 text-blue-400 hover:text-blue-600"
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
            placeholder="添加标签..."
            className="min-w-[80px] border-none bg-transparent py-0.5 text-xs text-slate-500 outline-none placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="flex-1 overflow-hidden">
        <TiptapEditor
          content={content}
          onChange={handleContentChange}
          className="h-full"
        />
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-1.5 text-xs text-slate-400">
        <span>{content.replace(/<[^>]*>/g, '').length} 字</span>
        <span>自动保存已开启</span>
      </div>
    </div>
  )
}
