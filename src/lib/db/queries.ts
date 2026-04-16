import { db } from './schema'
import type { Note, Notebook, ChatSession, ChatMessage } from '../../types'

// ==================== Notebook ====================

export async function getNotebooks(): Promise<Notebook[]> {
  return db.notebooks.orderBy('sortOrder').toArray()
}

export async function createNotebook(
  name: string,
  description: string,
  icon?: string
): Promise<number> {
  const now = new Date()
  const count = await db.notebooks.count()
  return db.notebooks.add({
    name,
    description,
    icon,
    noteCount: 0,
    sortOrder: count,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateNotebook(
  id: number,
  data: Partial<Pick<Notebook, 'name' | 'description' | 'icon' | 'sortOrder'>>
): Promise<void> {
  await db.notebooks.update(id, { ...data, updatedAt: new Date() })
}

export async function deleteNotebook(id: number): Promise<void> {
  await db.transaction('rw', [db.notebooks, db.notes], async () => {
    await db.notes.where('notebookId').equals(id).delete()
    await db.notebooks.delete(id)
  })
}

// ==================== Note ====================

export async function getNotesByNotebook(notebookId: number): Promise<Note[]> {
  return db.notes
    .where('notebookId')
    .equals(notebookId)
    .reverse()
    .sortBy('updatedAt')
}

export async function createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date()
  const noteId = await db.notes.add({
    ...data,
    createdAt: now,
    updatedAt: now,
  })

  // 更新笔记本的笔记计数
  const notebook = await db.notebooks.get(data.notebookId)
  if (notebook) {
    await db.notebooks.update(data.notebookId, {
      noteCount: (notebook.noteCount || 0) + 1,
    })
  }

  return noteId
}

export async function updateNote(
  id: number,
  data: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'wordCount' | 'notebookId'>>
): Promise<void> {
  const oldNote = await db.notes.get(id)
  const oldNotebookId = oldNote?.notebookId
  const newNotebookId = data.notebookId

  await db.notes.update(id, { ...data, updatedAt: new Date() })

  // 如果笔记本发生了变更，更新两个笔记本的笔记计数
  if (newNotebookId !== undefined && oldNotebookId !== undefined && newNotebookId !== oldNotebookId) {
    const oldNotebook = await db.notebooks.get(oldNotebookId)
    if (oldNotebook) {
      await db.notebooks.update(oldNotebookId, {
        noteCount: Math.max(0, (oldNotebook.noteCount || 0) - 1),
      })
    }

    const newNotebook = await db.notebooks.get(newNotebookId)
    if (newNotebook) {
      await db.notebooks.update(newNotebookId, {
        noteCount: (newNotebook.noteCount || 0) + 1,
      })
    }
  }
}

export async function deleteNote(id: number): Promise<void> {
  const note = await db.notes.get(id)
  if (!note) return

  await db.notes.delete(id)

  // 更新笔记本的笔记计数
  const notebook = await db.notebooks.get(note.notebookId)
  if (notebook) {
    await db.notebooks.update(note.notebookId, {
      noteCount: Math.max(0, (notebook.noteCount || 0) - 1),
    })
  }
}

export async function searchNotes(query: string): Promise<Note[]> {
  const lowerQuery = query.toLowerCase()

  // 搜索标题和内容
  const allNotes = await db.notes.toArray()
  return allNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

// ==================== Chat Session ====================

export async function getChatSessions(): Promise<ChatSession[]> {
  return db.chatSessions.orderBy('updatedAt').reverse().toArray()
}

export async function createChatSession(title?: string): Promise<number> {
  const now = new Date()
  return db.chatSessions.add({
    title: title || '新会话',
    tags: [],
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateChatSession(id: number, updates?: { title?: string }): Promise<void> {
  await db.chatSessions.update(id, { updatedAt: new Date(), ...updates })
}

export async function deleteChatSession(id: number): Promise<void> {
  await db.transaction('rw', [db.chatSessions, db.chatMessages], async () => {
    await db.chatMessages.where('sessionId').equals(id).delete()
    await db.chatSessions.delete(id)
  })
}

// ==================== Chat Message ====================

export async function addChatMessage(data: {
  sessionId: number
  role: string
  content: string
  tokenCount: number
  model: string
}): Promise<number> {
  return db.chatMessages.add({
    ...data,
    createdAt: new Date(),
  })
}

export async function getChatMessages(sessionId: number): Promise<ChatMessage[]> {
  return db.chatMessages
    .where('sessionId')
    .equals(sessionId)
    .sortBy('createdAt')
}

// ==================== Settings ====================

export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.where('key').equals(key).first()
  return setting?.value
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first()
  if (existing) {
    await db.settings.update(existing.id!, { value })
  } else {
    await db.settings.add({ key, value })
  }
}
