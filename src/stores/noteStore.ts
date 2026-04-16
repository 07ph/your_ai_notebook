import { create } from 'zustand'
import type { Notebook, Note } from '../types'
import * as queries from '../lib/db/queries'

interface NoteState {
  notebooks: Notebook[]
  currentNotebookId: number | null
  notes: Note[]
  currentNoteId: number | null
  initialized: boolean

  init: () => Promise<void>
  loadNotebooks: () => Promise<void>
  createNotebook: (name: string, description?: string, icon?: string) => Promise<number>
  deleteNotebook: (notebookId: number) => Promise<void>
  selectNotebook: (notebookId: number) => Promise<void>
  loadNotes: (notebookId: number) => Promise<void>
  createNote: (notebookId: number, title: string, content?: string, tags?: string[], source?: Note['source']) => Promise<number>
  updateNote: (noteId: number, updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => void
  deleteNote: (noteId: number) => Promise<void>
  selectNote: (noteId: number) => void
}

export const useNoteStore = create<NoteState>()((set, get) => ({
  notebooks: [],
  currentNotebookId: null,
  notes: [],
  currentNoteId: null,
  initialized: false,

  init: async () => {
    const notebooks = await queries.getNotebooks()
    set({ notebooks, initialized: true })
    // 如果有笔记本，默认选中第一个
    if (notebooks.length > 0 && !get().currentNotebookId) {
      get().selectNotebook(notebooks[0].id!)
    }
  },

  loadNotebooks: async () => {
    const notebooks = await queries.getNotebooks()
    set({ notebooks })
  },

  createNotebook: async (name, description = '', icon) => {
    const id = await queries.createNotebook(name, description, icon)
    await get().loadNotebooks()
    return id
  },

  deleteNotebook: async (notebookId) => {
    await queries.deleteNotebook(notebookId)
    const { currentNotebookId } = get()
    if (currentNotebookId === notebookId) {
      const remaining = get().notebooks.filter((n) => n.id !== notebookId)
      if (remaining.length > 0) {
        await get().selectNotebook(remaining[0].id!)
      } else {
        set({ currentNotebookId: null, notes: [], currentNoteId: null })
        await get().loadNotebooks()
      }
    } else {
      await get().loadNotebooks()
    }
  },

  selectNotebook: async (notebookId) => {
    set({ currentNotebookId: notebookId, currentNoteId: null })
    await get().loadNotes(notebookId)
  },

  loadNotes: async (notebookId) => {
    const notes = await queries.getNotesByNotebook(notebookId)
    set({ notes })
  },

  createNote: async (notebookId, title, content = '', tags = [], source = 'manual') => {
    const id = await queries.createNote({
      notebookId,
      title,
      content,
      tags,
      wordCount: content.length,
      source,
    })
    // 重新加载笔记列表以获取数据库生成的真实数据
    await get().loadNotes(notebookId)
    // 选中新创建的笔记
    set({ currentNoteId: id })
    // 重新加载笔记本以更新计数
    await get().loadNotebooks()
    return id
  },

  updateNote: (noteId, updates) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === noteId
          ? { ...n, ...updates, updatedAt: new Date() }
          : n
      ),
    }))
  },

  deleteNote: async (noteId) => {
    const { currentNoteId, currentNotebookId } = get()
    await queries.deleteNote(noteId)
    if (currentNoteId === noteId) {
      set({ currentNoteId: null })
    }
    if (currentNotebookId) {
      await get().loadNotes(currentNotebookId)
    }
    await get().loadNotebooks()
  },

  selectNote: (noteId) => {
    set({ currentNoteId: noteId })
  },
}))
