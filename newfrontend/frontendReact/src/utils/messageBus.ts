/**
 * Simple typed event bus for cross-component messaging.
 * Used to decouple WebSocket message delivery from UI components.
 */

type Listener<T = any> = (data: T) => void

interface MessageBusEvent {
  'new-chat-message': { msg: any; currentUserId: number }
  'unread-count-change': number
}

const listeners = new Map<keyof MessageBusEvent, Set<Listener<any>>>()

export function on<K extends keyof MessageBusEvent>(
  event: K,
  listener: Listener<MessageBusEvent[K]>,
): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set())
  }
  listeners.get(event)!.add(listener)
  return () => {
    listeners.get(event)?.delete(listener)
  }
}

export function emit<K extends keyof MessageBusEvent>(
  event: K,
  data: MessageBusEvent[K],
): void {
  listeners.get(event)?.forEach((fn) => fn(data))
}

export function off<K extends keyof MessageBusEvent>(
  event: K,
  listener: Listener<MessageBusEvent[K]>,
): void {
  listeners.get(event)?.delete(listener)
}
