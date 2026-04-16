import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Avatar, Input, Button, message as antMessage } from 'antd'
import { SendOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { chatApi, type Message } from '@/api'
import { useUserStore } from '@/stores/user'
import { connectWebSocket, subscribeUserMessages, unsubscribeUserMessages } from '@/utils/websocket'
import './Detail.scss'

const ChatDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userId, userInfo } = useUserStore()

  const currentUserId = userId || 0
  const currentUserAvatar = userInfo?.avatar || ''

  const [peerName, setPeerName] = useState('')
  const [peerAvatar, setPeerAvatar] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const targetUserId = Number(id)

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    if (!targetUserId) return

    if (!currentUserId) {
      console.error('未获取到当前用户ID，无法建立聊天')
      return
    }

    Promise.all([
      chatApi.getConversations(),
      chatApi.getMessages(targetUserId, 1, 100),
    ])
      .then(([convs, msgs]) => {
        const conv = convs.find((c) => c.peerId === targetUserId)
        if (conv) {
          setPeerName(conv.peerName)
          setPeerAvatar(conv.peerAvatar)
          chatApi.markAsRead(targetUserId)
        }
        setMessages(msgs.records || [])
        setTimeout(scrollToBottom, 0)
      })
      .catch((error) => console.error('Failed to load chat:', error))

    connectWebSocket()
      .then(() => {
        subscribeUserMessages(currentUserId, (msg: any) => {
          const normalized: Message = {
            ...msg,
            type: msg.type || (msg.messageType === 2 ? 'image' : msg.messageType === 3 ? 'product' : 'text'),
          }
          if (normalized.senderId === targetUserId || normalized.receiverId === targetUserId) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === normalized.id)
              if (exists) return prev
              setTimeout(scrollToBottom, 0)
              return [...prev, normalized]
            })
          }
        })
      })
      .catch((error) => console.error('WebSocket 连接失败:', error))

    return () => {
      unsubscribeUserMessages(currentUserId)
    }
  }, [targetUserId, currentUserId, scrollToBottom])

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text) return

    try {
      const msg = await chatApi.sendMessage({
        receiverId: targetUserId,
        content: text,
        type: 'text',
      })
      setMessages((prev) => [...prev, msg])
      setInputText('')
      setTimeout(scrollToBottom, 0)
    } catch (error) {
      console.error('Failed to send message:', error)
      antMessage.error('发送失败')
    }
  }

  const previewImage = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div className="chat-detail-page">
      <div className="chat-detail-inner">
        {/* Header */}
        <div className="chat-detail-header">
          <a className="back-link" onClick={() => navigate(-1)}>
            <ArrowLeftOutlined /> 返回
          </a>
          <h2 className="peer-name">{peerName}</h2>
          <div className="header-spacer" />
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="messages-area">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-row ${msg.senderId === currentUserId ? 'mine' : 'theirs'}`}
            >
              {msg.senderId !== currentUserId && (
                <Avatar size={36} src={peerAvatar} className="msg-avatar" />
              )}
              <div className="msg-bubble">
                {msg.type === 'text' && <div className="msg-text">{msg.content}</div>}
                {msg.type === 'image' && (
                  <div className="msg-image">
                    <img src={msg.content} alt="" onClick={() => previewImage(msg.content)} />
                  </div>
                )}
                {msg.type === 'product' && msg.productSnapshot && (
                  <div
                    className="msg-product"
                    onClick={() => navigate(`/product/${msg.productId}`)}
                  >
                    <img src={msg.productSnapshot.coverImage} alt="" />
                    <div className="msg-product-info">
                      <span className="msg-product-title">{msg.productSnapshot.title}</span>
                      <span className="msg-product-price">¥{msg.productSnapshot.price}</span>
                    </div>
                  </div>
                )}
              </div>
              {msg.senderId === currentUserId && (
                <Avatar size={36} src={currentUserAvatar} className="msg-avatar" />
              )}
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div className="input-bar glass">
          <div className="input-inner">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入消息..."
              size="large"
              onPressEnter={handleSend}
              suffix={
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  style={{ borderRadius: '0 980px 980px 0' }}
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatDetail
