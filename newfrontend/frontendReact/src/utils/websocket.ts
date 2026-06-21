import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { emit } from './messageBus'

const RECONNECT_DELAY = 5000
const HEARTBEAT_INTERVAL = 10000

let stompClient: Client | null = null
let currentUserId: number | null = null
let globalSubscriptionId: string | null = null

/** Init WebSocket connection (singleton — safe to call multiple times) */
export function initWebSocket(token: string, userId: number): Promise<void> {
  if (stompClient?.active && currentUserId === userId) {
    return Promise.resolve()
  }

  // If switching user or re-initializing, destroy old first
  if (stompClient) {
    destroyWebSocket()
  }

  currentUserId = userId

  return new Promise((resolve, reject) => {
    stompClient = new Client({
      webSocketFactory: () => new SockJS('/api/v1/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('[STOMP]', str)
      },
      reconnectDelay: RECONNECT_DELAY,
      heartbeatIncoming: HEARTBEAT_INTERVAL,
      heartbeatOutgoing: HEARTBEAT_INTERVAL,
      onConnect: () => {
        console.log('[STOMP] 连接成功')
        subscribeGlobal()
        resolve()
      },
      onStompError: (frame) => {
        console.error('[STOMP] 错误:', frame.headers['message'], frame.body)
        reject(new Error(frame.headers['message'] || 'STOMP error'))
      },
      onWebSocketClose: () => {
        console.log('[STOMP] WebSocket 连接关闭')
      },
    })

    stompClient.activate()
  })
}

/** Subscribe to own user messages globally */
function subscribeGlobal() {
  if (!stompClient?.active || !currentUserId) {
    console.warn('[STOMP] subscribeGlobal 失败: 客户端未激活或未登录')
    return
  }

  const destination = `/queue/messages/${currentUserId}`
  console.log('[STOMP] 正在订阅:', destination)

  const sub = stompClient.subscribe(destination, (msg) => {
    console.log('[STOMP] 收到消息! body:', msg.body)
    console.log('[STOMP] 消息 headers:', msg.headers)
    try {
      const data = JSON.parse(msg.body)
      console.log('[STOMP] 解析成功:', data)
      emit('new-chat-message', { msg: data, currentUserId })
      console.log('[STOMP] 已 emit new-chat-message 事件')
    } catch (e) {
      console.error('[STOMP] 解析消息失败:', e)
    }
  })

  globalSubscriptionId = sub.id
  console.log('[STOMP] 已订阅全局消息推送, subscription id:', sub.id)
  console.log('[STOMP] 当前 currentUserId:', currentUserId)
}

/** Destroy WebSocket connection */
export function destroyWebSocket() {
  globalSubscriptionId = null
  currentUserId = null
  if (stompClient) {
    try {
      stompClient.deactivate()
    } catch {
      // ignore deactivate errors
    }
    stompClient = null
  }
}

/** Check if connected */
export function isWsConnected(): boolean {
  return stompClient?.active ?? false
}
