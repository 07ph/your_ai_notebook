export interface Note {
  id?: number
  notebookId: number
  title: string
  content: string
  tags: string[]
  wordCount: number
  source: 'ai' | 'manual' | 'import'
  sourceSessionId?: number
  createdAt: Date
  updatedAt: Date
}

export interface Notebook {
  id?: number
  name: string
  description: string
  icon?: string
  noteCount: number
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface ChatSession {
  id?: number
  title: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id?: number
  sessionId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  imageUrl?: string
  tokenCount: number
  model: string
  createdAt: Date
}

export interface AppSettings {
  id?: number
  key: string
  value: string
}

export type AIProvider = 'openai' | 'deepseek' | 'qwen'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
}
