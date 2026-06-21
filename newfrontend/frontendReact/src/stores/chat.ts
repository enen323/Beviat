import { create } from 'zustand'
import type { Message } from '@/api'
import { chatApi } from '@/api'

interface ChatStore {
  /** Total unread messages across all conversations */
  unreadCount: number
  /** Messages received via WebSocket while not on chat page */
  incomingMessages: Message[]
  /** Set unread count (from API) */
  setUnreadCount: (count: number) => void
  /** Refetch unread count from server */
  refetchUnreadCount: () => Promise<void>
  /** Add incoming WebSocket message */
  addIncomingMessage: (msg: Message) => void
  /** Clear the incoming message buffer (after processing) */
  clearIncomingMessages: () => void
  /** Increment unread count by 1 */
  incrementUnread: () => void
  /** Decrement unread by specific amount */
  decrementUnread: (n: number) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  unreadCount: 0,
  incomingMessages: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  refetchUnreadCount: async () => {
    try {
      const convs = await chatApi.getConversations()
      const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      set({ unreadCount: total })
    } catch {
      // ignore
    }
  },

  addIncomingMessage: (msg) =>
    set((state) => ({
      incomingMessages: [...state.incomingMessages, msg],
    })),

  clearIncomingMessages: () => set({ incomingMessages: [] }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnread: (n) =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - n),
    })),
}))
