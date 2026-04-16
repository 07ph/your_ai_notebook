import { create } from 'zustand'
import type { ChatSession, ChatMessage } from '../types'
import * as queries from '../lib/db/queries'

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: number | null
  messages: ChatMessage[]
  isLoading: boolean
  initialized: boolean

  init: () => Promise<void>
  createSession: (title?: string) => Promise<number>
  switchSession: (sessionId: number) => Promise<void>
  deleteSession: (sessionId: number) => Promise<void>
  renameSession: (sessionId: number, newTitle: string) => Promise<void>
  addMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => Promise<void>
  setMessages: (messages: ChatMessage[]) => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create<ChatState>()((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  isLoading: false,
  initialized: false,

  init: async () => {
    const sessions = await queries.getChatSessions()
    set({ sessions, initialized: true })
  },

  createSession: async (title) => {
    const id = await queries.createChatSession(title || undefined)
    const sessions = await queries.getChatSessions()
    set({ sessions, currentSessionId: id, messages: [] })
    return id
  },

  switchSession: async (sessionId) => {
    const messages = await queries.getChatMessages(sessionId)
    set({ currentSessionId: sessionId, messages })
  },

  deleteSession: async (sessionId) => {
    await queries.deleteChatSession(sessionId)
    const { currentSessionId } = get()
    const sessions = await queries.getChatSessions()
    let newCurrentId = currentSessionId
    if (currentSessionId === sessionId) {
      newCurrentId = sessions.length > 0 ? sessions[0].id! : null
    }
    set({
      sessions,
      currentSessionId: newCurrentId,
      messages: newCurrentId ? await queries.getChatMessages(newCurrentId) : [],
    })
  },

  renameSession: async (sessionId: number, newTitle: string) => {
    await queries.updateChatSession(sessionId, { title: newTitle })
    const sessions = await queries.getChatSessions()
    set({ sessions })
  },

  addMessage: async (message) => {
    // 写入数据库
    await queries.addChatMessage({
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      tokenCount: message.tokenCount,
      model: message.model,
    })
    // 更新会话时间
    await queries.updateChatSession(message.sessionId)

    // 重新加载当前会话的消息
    const { currentSessionId } = get()
    if (currentSessionId === message.sessionId) {
      const messages = await queries.getChatMessages(message.sessionId)
      set({ messages })
    }
    // 更新会话列表（updatedAt 变了）
    const sessions = await queries.getChatSessions()
    set({ sessions })
  },

  setMessages: (messages) => {
    set({ messages })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },
}))
