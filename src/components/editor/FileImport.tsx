import { useState, useRef, useCallback } from 'react'

interface UseFileImportOptions {
  /** 文件读取完成回调 */
  onFileLoaded?: (content: string, fileName: string) => void
  /** 允许的文件扩展名 */
  accept?: string[]
}

interface UseFileImportReturn {
  /** 是否正在拖拽中 */
  isDragging: boolean
  /** 拖拽事件处理器，绑定到目标容器 */
  dragHandlers: {
    onDragEnter: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
  /** 隐藏的 file input ref */
  inputRef: React.RefObject<HTMLInputElement | null>
  /** 触发文件选择器 */
  openFilePicker: () => void
}

/**
 * 文件导入 hook，支持拖拽导入和点击选择。
 * 默认只接受 .md 和 .markdown 文件。
 */
export function useFileImport(options: UseFileImportOptions = {}): UseFileImportReturn {
  const { onFileLoaded, accept = ['.md', '.markdown'] } = options

  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dragCounterRef = useRef(0)

  const isValidFile = useCallback(
    (file: File) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      return accept.includes(ext)
    },
    [accept],
  )

  const readFile = useCallback(
    (file: File) => {
      if (!isValidFile(file)) {
        console.warn(`不支持的文件类型: ${file.name}，仅支持 ${accept.join(', ')}`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text === 'string' && onFileLoaded) {
          onFileLoaded(text, file.name)
        }
      }
      reader.onerror = () => {
        console.error(`文件读取失败: ${file.name}`)
      }
      reader.readAsText(file)
    },
    [isValidFile, onFileLoaded, accept],
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounterRef.current = 0

      const files = e.dataTransfer.files
      if (files.length > 0) {
        readFile(files[0])
      }
    },
    [readFile],
  )

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return {
    isDragging,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    inputRef,
    openFilePicker,
  }
}
