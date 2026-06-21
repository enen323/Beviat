import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { chatApi, type Conversation } from '@/api'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { on } from '@/utils/messageBus'
import './index.scss'

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
  if (minutes < 2880) return '昨天'
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate()
  const { userId } = useUserStore()
  const { setUnreadCount } = useChatStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    chatApi
      .getConversations()
      .then((data) => {
        setConversations(data)
        const total = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
        setUnreadCount(total)
      })
      .catch((error) => console.error('Failed to load conversations:', error))
      .finally(() => setLoading(false))
  }, [setUnreadCount])

  // Listen for new messages to reorder conversations in real-time
  useEffect(() => {
    const unsub = on('new-chat-message', ({ msg }) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.peerId === msg.senderId || c.peerId === msg.receiverId)
        let updated: Conversation[]

        if (idx >= 0) {
          // Update existing conversation
          const conv = { ...prev[idx] }
          conv.lastMessage = msg.content
          conv.lastMessageTime = msg.createdAt
          if (msg.receiverId === userId) {
            conv.unreadCount = (conv.unreadCount || 0) + 1
          }
          updated = [conv, ...prev.slice(0, idx), ...prev.slice(idx + 1)]
        } else {
          // Unknown sender — prepend placeholder, will refresh on next load
          updated = prev
        }

        return updated
      })
    })
    return unsub
  }, [userId])

  return (
    <div className="chat-page">
      <div className="chat-inner">
        <div className="chat-header">
          <h1 className="chat-title">消息</h1>
        </div>

        {loading ? (
          <div className="chat-loading">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <span>加载中...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="chat-empty">
            <p>暂无消息</p>
            <span className="empty-hint">浏览商品时点击"我想要"即可开始聊天</span>
          </div>
        ) : (
          <div className="conversation-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="conversation-item glass-card"
                onClick={() => navigate(`/chat/${conv.peerId}`)}
              >
                <Avatar size={48} src={conv.peerAvatar} />
                <div className="conv-info">
                  <div className="conv-top">
                    <span className="conv-name">{conv.peerName}</span>
                    <span className="conv-time">{formatTime(conv.lastMessageTime)}</span>
                  </div>
                  <div className="conv-bottom">
                    <span className="conv-last-msg">{conv.lastMessage}</span>
                    {conv.unreadCount > 0 && (
                      <span className="conv-badge">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  {conv.productSnapshot && (
                    <div className="conv-product">
                      <img src={conv.productSnapshot.coverImage} alt="" />
                      <span>¥{conv.productSnapshot.price}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage
