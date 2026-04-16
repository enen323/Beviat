import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tag, Avatar, Spin, Empty } from 'antd'
import {
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  EditOutlined,
  FireOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { communityApi } from '@/api'
import type { Post } from '@/api'
import './index.scss'

const sortOptions = [
  { key: 'latest', label: '最新', icon: <ClockCircleOutlined /> },
  { key: 'hot', label: '最热', icon: <FireOutlined /> },
]

const tagOptions = ['全部', '生活', '学习', '二手', '活动', '求助', '分享']

const CommunityList: React.FC = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('latest')
  const [activeTag, setActiveTag] = useState('全部')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())

  const fetchPosts = async (pageNum: number, append = false) => {
    setLoading(true)
    try {
      const params: { sortBy?: string; tag?: string; page: number; size: number } = {
        page: pageNum,
        size: 10,
      }
      if (sortBy !== 'latest') params.sortBy = sortBy
      if (activeTag !== '全部') params.tag = activeTag
      const res = await communityApi.getPosts(params)
      const list = res.records || []
      setPosts(append ? (prev) => [...prev, ...list] : list)
      setHasMore(pageNum < res.pages)
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchPosts(1)
  }, [sortBy, activeTag])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage, true)
  }

  const handleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation()
    try {
      await communityApi.likePost(postId)
      setLikedPosts((prev) => {
        const next = new Set(prev)
        if (next.has(postId)) next.delete(postId)
        else next.add(postId)
        return next
      })
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1,
              }
            : p
        )
      )
    } catch {
      // handled
    }
  }

  return (
    <div className="community-page">
      <div className="community-header">
        <h1 className="community-title">社区</h1>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate('/community/create')}
          className="create-post-btn"
        >
          发帖
        </Button>
      </div>

      <div className="community-filters">
        <div className="sort-filter">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              className={`sort-btn ${sortBy === opt.key ? 'active' : ''}`}
              onClick={() => setSortBy(opt.key)}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
        <div className="tag-filter">
          {tagOptions.map((tag) => (
            <Tag
              key={tag}
              className={`tag-pill ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </div>

      <Spin spinning={loading && posts.length === 0}>
        {posts.length === 0 && !loading ? (
          <Empty description="暂无帖子" />
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <div
                key={post.id}
                className="post-card glass-card"
                onClick={() => navigate(`/community/post/${post.id}`)}
              >
                <div className="post-author">
                  <Avatar size={36} src={post.authorAvatar}>
                    {post.authorName?.charAt(0)}
                  </Avatar>
                  <span className="author-name">{post.authorName}</span>
                  <span className="post-time">
                    {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                <h3 className="post-title">{post.title}</h3>
                <p className="post-content-preview">{post.content}</p>

                {post.images && post.images.length > 0 && (
                  <div className="post-images">
                    {post.images.slice(0, 3).map((img, idx) => (
                      <div key={idx} className="post-image-item">
                        <img src={img} alt="" />
                      </div>
                    ))}
                    {post.images.length > 3 && (
                      <div className="post-image-more">+{post.images.length - 3}</div>
                    )}
                  </div>
                )}

                <div className="post-footer">
                  <div className="post-tags">
                    {post.tags?.map((tag, idx) => (
                      <Tag key={idx} className="post-tag">{tag}</Tag>
                    ))}
                  </div>
                  <div className="post-actions">
                    <span
                      className={`action-item ${post.isLiked || likedPosts.has(post.id) ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, post.id)}
                    >
                      {post.isLiked || likedPosts.has(post.id) ? (
                        <LikeFilled />
                      ) : (
                        <LikeOutlined />
                      )}
                      {post.likeCount}
                    </span>
                    <span className="action-item">
                      <MessageOutlined /> {post.commentCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>

      {hasMore && posts.length > 0 && (
        <div className="community-load-more">
          <Button loading={loading} onClick={handleLoadMore} block>
            加载更多
          </Button>
        </div>
      )}
    </div>
  )
}

export default CommunityList
