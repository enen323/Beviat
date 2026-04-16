import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Avatar, Tag, Input, Spin, Empty, message } from 'antd'
import {
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { communityApi } from '@/api'
import type { Post, Comment } from '@/api'
import { useUserStore } from '@/stores/user'
import './Detail.scss'

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, userInfo } = useUserStore()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const [postData, commentsData] = await Promise.all([
          communityApi.getPostDetail(Number(id)),
          communityApi.getComments(Number(id)),
        ])
        setPost(postData)
        setComments(buildCommentTree(commentsData))
      } catch {
        // handled
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const map = new Map<number, Comment>()
    const roots: Comment[] = []
    flatComments.forEach((c) => map.set(c.id, { ...c, replies: [] }))
    map.forEach((c) => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies!.push(c)
      } else {
        roots.push(c)
      }
    })
    return roots
  }

  const handleLike = async () => {
    if (!post || !isLoggedIn) return
    try {
      await communityApi.likePost(post.id)
      setPost((prev) =>
        prev
          ? { ...prev, isLiked: !prev.isLiked, likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1 }
          : prev
      )
    } catch {
      // handled
    }
  }

  const handleSubmitComment = async () => {
    if (!id || !commentContent.trim()) return
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/auth/login')
      return
    }
    setSubmitting(true)
    try {
      const newComment = await communityApi.createComment(Number(id), {
        content: commentContent.trim(),
        parentId: replyTo?.id,
      })
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies || []), newComment] }
              : c
          )
        )
      } else {
        setComments((prev) => [...prev, { ...newComment, replies: [] }])
      }
      setCommentContent('')
      setReplyTo(null)
      setPost((prev) =>
        prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev
      )
      message.success('评论成功')
    } catch {
      // handled
    } finally {
      setSubmitting(false)
    }
  }

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`comment-item ${depth > 0 ? 'reply' : ''}`}>
      <div className="comment-header">
        <Avatar size={depth > 0 ? 24 : 32} src={comment.authorAvatar} icon={<UserOutlined />}>
          {comment.authorName?.charAt(0)}
        </Avatar>
        <span className="comment-author">{comment.authorName}</span>
        <span className="comment-time">
          {new Date(comment.createdAt).toLocaleString('zh-CN')}
        </span>
      </div>
      <div className="comment-body">
        <p className="comment-content">{comment.content}</p>
        <Button
          type="text"
          size="small"
          onClick={() => {
            setReplyTo(comment)
            setCommentContent(`@${comment.authorName} `)
          }}
        >
          回复
        </Button>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="community-detail-loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="community-detail-loading">
        <Empty description="帖子不存在" />
      </div>
    )
  }

  return (
    <div className="community-detail">
      <div className="detail-back">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/community')}>
          返回社区
        </Button>
      </div>

      <div className="detail-content glass-card">
        <div className="detail-author">
          <Avatar size={44} src={post.authorAvatar} icon={<UserOutlined />}>
            {post.authorName?.charAt(0)}
          </Avatar>
          <div className="author-info">
            <span className="author-name">{post.authorName}</span>
            <span className="post-time">
              {new Date(post.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>

        <h1 className="detail-title">{post.title}</h1>
        <div className="detail-body">{post.content}</div>

        {post.images && post.images.length > 0 && (
          <div className="detail-images">
            {post.images.map((img, idx) => (
              <div key={idx} className="detail-image-item">
                <img src={img} alt="" />
              </div>
            ))}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="detail-tags">
            {post.tags.map((tag, idx) => (
              <Tag key={idx} className="detail-tag">{tag}</Tag>
            ))}
          </div>
        )}

        <div className="detail-actions">
          <Button
            type="text"
            icon={post.isLiked ? <LikeFilled /> : <LikeOutlined />}
            className={`action-btn ${post.isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            {post.likeCount} 赞
          </Button>
          <Button type="text" icon={<MessageOutlined />} className="action-btn">
            {post.commentCount} 评论
          </Button>
        </div>
      </div>

      {/* Comment Section */}
      <div className="comment-section">
        <h3 className="comment-section-title">评论 ({post.commentCount})</h3>

        <div className="comment-input-area glass-card">
          {replyTo && (
            <div className="reply-indicator">
              回复 <strong>@{replyTo.authorName}</strong>
              <Button type="text" size="small" onClick={() => { setReplyTo(null); setCommentContent('') }}>
                取消
              </Button>
            </div>
          )}
          <div className="comment-input-row">
            <Avatar size={32} src={userInfo?.avatar} icon={<UserOutlined />}>
              {userInfo?.nickname?.charAt(0)}
            </Avatar>
            <Input
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={isLoggedIn ? '写下你的评论...' : '登录后评论'}
              disabled={!isLoggedIn}
              onPressEnter={handleSubmitComment}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={handleSubmitComment}
              disabled={!commentContent.trim() || !isLoggedIn}
            />
          </div>
        </div>

        <div className="comment-list">
          {comments.length === 0 ? (
            <Empty description="暂无评论" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            comments.map((c) => renderComment(c))
          )}
        </div>
      </div>
    </div>
  )
}

export default CommunityDetail
