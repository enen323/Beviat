import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Avatar, Button, Tag, Spin, Empty, message, Popconfirm } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  StarOutlined,
  SettingOutlined,
  HeartOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  DeleteOutlined,
  CloseOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { userApi, browseHistoryApi } from '@/api'
import type { User, Product } from '@/api'
import { useUserStore } from '@/stores/user'
import Folder from '@/components/Folder'
import './Profile.scss'

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { userInfo: currentUser, isLoggedIn, userId: currentUserId } = useUserStore()

  const isSelf = !id || (currentUserId && Number(id) === currentUserId)
  const targetUserId = id ? Number(id) : currentUserId

  const [profile, setProfile] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [soldProducts, setSoldProducts] = useState<Product[]>([])
  const [favorites, setFavorites] = useState<Product[]>([])
  const [browseHistory, setBrowseHistory] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        if (isSelf) {
          const data = await userApi.getProfile()
          setProfile(data)
        } else if (targetUserId) {
          const data = await userApi.getProfile()
          setProfile(data)
        }
      } catch {
        // handled
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id, isSelf, targetUserId])

  useEffect(() => {
    const fetchTabData = async () => {
      try {
        const [available, sold, favs, history] = await Promise.all([
          userApi.getMyProducts('available'),
          userApi.getMyProducts('sold'),
          isSelf ? userApi.getFavorites() : Promise.resolve([]),
          isSelf ? browseHistoryApi.getHistory(20) : Promise.resolve([]),
        ])
        setProducts(available)
        setSoldProducts(sold)
        setFavorites(favs as Product[])
        setBrowseHistory(history as Product[])
      } catch {
        // handled
      }
    }
    if (!loading && isSelf) fetchTabData()
  }, [loading, isSelf])

  const handleFollow = async () => {
    if (!targetUserId || !isLoggedIn) {
      message.warning('请先登录')
      navigate('/auth/login')
      return
    }
    try {
      if (isFollowing) {
        await userApi.unfollow(targetUserId)
        setIsFollowing(false)
        message.success('已取消关注')
      } else {
        await userApi.follow(targetUserId)
        setIsFollowing(true)
        message.success('关注成功')
      }
    } catch {
      // handled
    }
  }

  const handleRemoveHistory = async (productId: number) => {
    try {
      await browseHistoryApi.removeHistory(productId)
      setBrowseHistory(prev => prev.filter(p => p.id !== productId))
      message.success('已删除')
    } catch {
      // handled
    }
  }

  const handleClearHistory = async () => {
    try {
      await browseHistoryApi.clearHistory()
      setBrowseHistory([])
      message.success('已清空浏览记录')
    } catch {
      // handled
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-loading">
        <Empty description="用户不存在" />
      </div>
    )
  }

  const genderLabel = profile.gender === 1 ? '男' : profile.gender === 2 ? '女' : '未设置'

  const renderProductGrid = (items: Product[], emptyText: string) => {
    if (items.length === 0) {
      return <Empty description={emptyText} className="folder-empty" />
    }
    return (
      <div className="product-grid">
        {items.map((product) => (
          <div
            key={product.id}
            className="product-card glass-card"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="product-card-image">
              <img src={product.coverImage || product.images?.[0]} alt={product.title} />
              {product.status === 'sold' && (
                <div className="sold-overlay">已售出</div>
              )}
            </div>
            <div className="product-card-body">
              <h4 className="product-card-title">{product.title}</h4>
              <span className="product-card-price">¥{product.price}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderBrowseHistory = (items: Product[]) => {
    if (items.length === 0) {
      return <Empty description="暂无浏览记录" className="folder-empty" />
    }
    return (
      <div className="browse-history-section">
        <div className="browse-history-header">
          <Popconfirm
            title="确定清空所有浏览记录？"
            onConfirm={handleClearHistory}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              清空记录
            </Button>
          </Popconfirm>
        </div>
        <div className="product-grid">
          {items.map((product) => (
            <div
              key={product.id}
              className="product-card glass-card browse-card"
            >
              <div
                className="product-card-image"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <img src={product.coverImage || product.images?.[0]} alt={product.title} />
                {product.status === 'sold' && (
                  <div className="sold-overlay">已售出</div>
                )}
              </div>
              <div className="product-card-body" onClick={() => navigate(`/product/${product.id}`)}>
                <h4 className="product-card-title">{product.title}</h4>
                <span className="product-card-price">¥{product.price}</span>
              </div>
              <Button
                type="text"
                size="small"
                className="browse-remove-btn"
                icon={<CloseOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveHistory(product.id)
                }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const folderItems = [
    {
      key: 'orders',
      label: '我的订单',
      icon: <ShoppingCartOutlined />,
      count: 0,
      color: '#0071e3',
      children: (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Button type="primary" onClick={() => navigate('/orders')} icon={<ShoppingCartOutlined />}>
            查看我的订单
          </Button>
        </div>
      ),
    },
    {
      key: 'products',
      label: '在售商品',
      icon: <ShoppingOutlined />,
      count: products.length,
      color: '#3B82F6',
      children: renderProductGrid(products, '暂无在售商品'),
    },
    {
      key: 'sold',
      label: '已售商品',
      icon: <StarOutlined />,
      count: soldProducts.length,
      color: '#F59E0B',
      children: renderProductGrid(soldProducts, '暂无已售商品'),
    },
    ...(isSelf
      ? [
          {
            key: 'favorites',
            label: '我的收藏',
            icon: <HeartOutlined />,
            count: favorites.length,
            color: '#EC4899',
            children: renderProductGrid(favorites, '暂无收藏'),
          },
          {
            key: 'browse-history',
            label: '浏览记录',
            icon: <HistoryOutlined />,
            count: browseHistory.length,
            color: '#8B5CF6',
            children: renderBrowseHistory(browseHistory),
          },
        ]
      : []),
  ]

  return (
    <div className="user-profile">
      {/* Profile Header Card */}
      <div className="profile-header glass-card">
        <div className="profile-banner" />
        <div className="profile-info">
          <div className="profile-avatar-section">
            <Avatar size={80} src={profile.avatar} icon={<UserOutlined />} className="profile-avatar">
              {profile.nickname?.charAt(0)}
            </Avatar>
            {isSelf && (
              <Button
                type="text"
                icon={<SettingOutlined />}
                className="settings-btn"
                onClick={() => navigate('/user/settings')}
              />
            )}
          </div>
          <div className="profile-details">
            <h1 className="profile-name">{profile.nickname || profile.username}</h1>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-meta">
              {profile.school && (
                <span className="meta-item">
                  <Tag>{profile.school}</Tag>
                </span>
              )}
              {profile.department && (
                <span className="meta-item">
                  <Tag>{profile.department}</Tag>
                </span>
              )}
              <span className="meta-item gender">{genderLabel}</span>
            </div>
            {/* 个人信息标签 */}
            <div className="profile-info-tags">
              {profile.major && (
                <span className="info-tag">
                  <BookOutlined /> {profile.major}
                  {profile.enrollYear && ` · ${profile.enrollYear}级`}
                </span>
              )}
              <span className="info-tag credit">
                <SafetyCertificateOutlined /> 信用分 {profile.creditScore}
              </span>
            </div>
          </div>
          {!isSelf && isLoggedIn && (
            <Button
              type={isFollowing ? 'default' : 'primary'}
              onClick={handleFollow}
              className="follow-btn"
            >
              {isFollowing ? '取消关注' : '关注'}
            </Button>
          )}
        </div>
      </div>

      {/* Folder-style Content Sections */}
      <Folder
        items={folderItems}
        defaultActiveKey={[]}
      />
    </div>
  )
}

export default UserProfile
