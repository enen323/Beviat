import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useUserStore } from './stores/user'
import { useChatStore } from './stores/chat'
import { initWebSocket, destroyWebSocket } from './utils/websocket'
import { on } from './utils/messageBus'
import { chatApi } from './api'

/** Manages global WebSocket lifecycle based on auth state */
function WebSocketManager() {
  const { token, userId, isLoggedIn } = useUserStore()
  const addIncomingMessage = useChatStore((s) => s.addIncomingMessage)
  const incrementUnread = useChatStore((s) => s.incrementUnread)

  useEffect(() => {
    if (!isLoggedIn || !token || !userId) {
      destroyWebSocket()
      return
    }

    initWebSocket(token, userId).catch((err) => {
      console.warn('[WS] init failed:', err)
    })

    return () => {
      destroyWebSocket()
    }
  }, [isLoggedIn, token, userId])

  // Listen for incoming messages globally
  useEffect(() => {
    const unsub = on('new-chat-message', ({ msg, currentUserId }) => {
      // Receiver gets the message — increment unread
      if (msg.receiverId === currentUserId) {
        addIncomingMessage(msg)
        incrementUnread()
      }
    })
    return unsub
  }, [addIncomingMessage, incrementUnread])

  // Fetch initial unread count
  useEffect(() => {
    if (!isLoggedIn || !userId) return
    chatApi.getConversations().then((convs) => {
      const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      useChatStore.getState().setUnreadCount(total)
    }).catch(() => {})
  }, [isLoggedIn, userId])

  return null
}

function App() {
  return (
    <>
      <WebSocketManager />
      <RouterProvider router={router} />
    </>
  )
}

export default App
