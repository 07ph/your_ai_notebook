import Dexie, { type Table } from 'dexie'
import type { Note, Notebook, ChatSession, ChatMessage, AppSettings } from '../../types'

export class StudyMarkDB extends Dexie {
  notebooks!: Table<Notebook, number>
  notes!: Table<Note, number>
  chatSessions!: Table<ChatSession, number>
  chatMessages!: Table<ChatMessage, number>
  settings!: Table<AppSettings, number>

  constructor() {
    super('StudyMarkDB')

    this.version(1).stores({
      notebooks: '++id, name, sortOrder, createdAt',
      notes: '++id, notebookId, source, sourceSessionId, createdAt, updatedAt, *tags',
      chatSessions: '++id, title, createdAt, updatedAt',
      chatMessages: '++id, sessionId, role, createdAt',
      settings: '++id, &key',
    })
  }
}

export const db = new StudyMarkDB()
