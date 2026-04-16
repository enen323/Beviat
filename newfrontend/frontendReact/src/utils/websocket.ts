import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { useUserStore } from '@/stores/user'

let stompClient: Client | null = null
const subscriptions = new Map<string, { id: string; callback: (msg: IMessage) => void }>()

/** 连接 WebSocket */
export function connectWebSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    const { token } = useUserStore.getState()
    if (!token) {
      reject(new Error('未登录'))
      return
    }

    if (stompClient?.active) {
      resolve()
      return
    }

    stompClient = new Client({
      webSocketFactory: () => new SockJS('/api/v1/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('[STOMP]', str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log('[STOMP] 连接成功')
        resubscribeAll()
        resolve()
      },
      onStompError: (frame) => {
        console.error('[STOMP] 错误:', frame.headers['message'])
        console.error('[STOMP] 详情:', frame.body)
        reject(new Error(frame.headers['message'] || 'STOMP error'))
      },
      onWebSocketClose: () => {
        console.log('[STOMP] WebSocket 连接关闭')
      },
    })

    stompClient.activate()
  })
}

/** 订阅用户点对点消息 */
export function subscribeUserMessages(
  userId: number,
  callback: (msg: any) => void
): void {
  const destination = `/user/${userId}/queue/messages`
  const key = `user-msg-${userId}`

  if (subscriptions.has(key)) {
    return
  }

  subscriptions.set(key, {
    id: '',
    callback: (msg: IMessage) => {
      try {
        const data = JSON.parse(msg.body)
        callback(data)
      } catch (e) {
        console.error('[STOMP] 解析消息失败:', e)
      }
    },
  })

  if (stompClient?.active) {
    doSubscribe(key, destination)
  }
}

function doSubscribe(key: string, destination: string) {
  const sub = subscriptions.get(key)
  if (!sub || !stompClient?.active) return

  const stompSub = stompClient.subscribe(destination, sub.callback)
  sub.id = stompSub.id
}

function resubscribeAll() {
  for (const [key, sub] of subscriptions) {
    const userId = key.replace('user-msg-', '')
    const destination = `/user/${userId}/queue/messages`
    doSubscribe(key, destination)
  }
}

/** 取消订阅 */
export function unsubscribeUserMessages(userId: number) {
  const key = `user-msg-${userId}`
  const sub = subscriptions.get(key)
  if (sub && stompClient?.active) {
    stompClient.unsubscribe(sub.id)
  }
  subscriptions.delete(key)
}

/** 断开连接 */
export function disconnectWebSocket() {
  if (stompClient?.active) {
    stompClient.deactivate()
  }
  subscriptions.clear()
  stompClient = null
}

/** 获取连接状态 */
export function isConnected(): boolean {
  return stompClient?.active ?? false
}
