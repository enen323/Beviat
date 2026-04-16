import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Avatar, Button, message, Spin, Modal, Radio, Input } from 'antd'
import {
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  AlipayCircleOutlined,
  WechatOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { productApi, orderApi, chatApi, type Product } from '@/api'
import { useUserStore } from '@/stores/user'
import { useDevice } from '@/hooks/useDevice'
import AmapComponent from '@/components/AmapComponent'
import './Detail.scss'

// 声明全局AMap类型
declare global {
  interface Window {
    AMap: any
  }
}

const conditionMap: Record<number, { label: string; color: string }> = {
  1: { label: '全新', color: '#34C759' },
  99: { label: '几乎全新', color: '#30D158' },
  95: { label: '轻微使用', color: '#FF9500' },
  90: { label: '明显使用', color: '#FF6B35' },
  80: { label: '有瑕疵', color: '#FF3B30' },
}

const tradeTypeMap: Record<number, { label: string; icon: string }> = {
  0: { label: '仅自提', icon: '📦' },
  1: { label: '仅快递', icon: '🚚' },
  2: { label: '自提/快递', icon: '📦🚚' },
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isPC } = useDevice()
  const { isLoggedIn, userInfo } = useUserStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({})
  const [orderLoading, setOrderLoading] = useState(false)
  const [payModalVisible, setPayModalVisible] = useState(false)
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null)
  const [payMethod, setPayMethod] = useState<'alipay' | 'wechat' | 'balance'>('alipay')
  const [payPassword, setPayPassword] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [buyerLocation, setBuyerLocation] = useState<{ lng: number; lat: number; address: string } | null>(null)

  // 页面加载时自动获取买家位置
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (window.AMap) {
          window.AMap.plugin('AMap.Geocoder', () => {
            const geocoder = new window.AMap.Geocoder()
            const lnglat = [pos.coords.longitude, pos.coords.latitude]
            geocoder.getAddress(lnglat, (status: string, result: any) => {
              const address = status === 'complete' && result.info === 'OK'
                ? result.regeocode.formattedAddress
                : ''
              setBuyerLocation({
                lng: pos.coords.longitude,
                lat: pos.coords.latitude,
                address,
              })
            })
          })
        } else {
          setBuyerLocation({
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
            address: '',
          })
        }
      },
      () => {
        console.warn('获取位置失败，下单时将不传递位置信息')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const isOwner = userInfo?.id === product?.sellerId

  const fetchProduct = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await productApi.detail(Number(id))
      setProduct(data)
      setFavorited(data.favorited || false)
      setFavoriteCount(data.favoriteCount || 0)
      document.title = `${data.title} - Beviat`
    } catch {
      message.error('商品不存在或已下架')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  const handleFavorite = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/auth/login')
      return
    }
    if (!product) return
    try {
      if (favorited) {
        await productApi.unfavorite(product.id)
        setFavorited(false)
        setFavoriteCount(prev => Math.max(0, prev - 1))
      } else {
        await productApi.favorite(product.id)
        setFavorited(true)
        setFavoriteCount(prev => prev + 1)
      }
    } catch {
      message.error('操作失败，请重试')
    }
  }

  const handleBuy = () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/auth/login')
      return
    }
    if (!product) return

    Modal.confirm({
      title: '确认购买',
      icon: <ExclamationCircleOutlined />,
      content: `确认以 ¥${product.price} 购买「${product.title}」？`,
      okText: '确认购买',
      cancelText: '取消',
      onOk: async () => {
        setOrderLoading(true)
        try {
          const order = await orderApi.create({
            productId: product.id,
            buyerLatitude: buyerLocation?.lat,
            buyerLongitude: buyerLocation?.lng,
            buyerAddress: buyerLocation?.address,
          })
          message.success('下单成功，请完成支付')
          setPendingOrderId(order.id)
          setPayModalVisible(true)
          setPayPassword('')
          setPayMethod('alipay')
        } catch {
          message.error('下单失败，请重试')
        } finally {
          setOrderLoading(false)
        }
      },
    })
  }

  const handlePay = async () => {
    if (!pendingOrderId) return
    if (!payPassword.trim()) {
      message.warning('请输入支付密码')
      return
    }
    setPayLoading(true)
    try {
      await orderApi.pay(pendingOrderId)
      message.success('支付成功，等待卖家确认')
      setPayModalVisible(false)
      setPendingOrderId(null)
      setPayPassword('')
      navigate(`/order/${pendingOrderId}`)
    } catch (e: any) {
      message.error(e?.message || '支付失败，请重试')
    } finally {
      setPayLoading(false)
    }
  }

  const handlePayLater = () => {
    if (pendingOrderId) {
      Modal.confirm({
        title: '稍后支付',
        content: '您可以稍后在订单详情中完成支付，订单将在30分钟内保留。',
        okText: '去订单支付',
        cancelText: '继续浏览',
        onOk: () => {
          setPayModalVisible(false)
          navigate(`/order/${pendingOrderId}`)
        },
        onCancel: () => {
          setPayModalVisible(false)
          setPendingOrderId(null)
        },
      })
    }
  }

  const handleChat = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/auth/login')
      return
    }
    if (!product) return
    try {
      await chatApi.sendMessage({
        receiverId: product.sellerId,
        content: `你好，我对「${product.title}」感兴趣，想了解更多信息。`,
        type: 'text',
        productId: product.id,
      })
      navigate('/chat')
    } catch {
      message.error('发送消息失败')
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板')
    }).catch(() => {
      message.info('请手动复制链接分享')
    })
  }

  // Image gallery keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!product?.images.length) return
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : product.images.length - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex(prev => (prev < product.images.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [product?.images.length])

  if (loading) {
    return (
      <div className="product-detail-loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!product) return null

  const condition = conditionMap[product.conditionLevel] || { label: '其他', color: '#8E8E93' }
  const tradeType = tradeTypeMap[product.tradeType] || { label: '未知', icon: '?' }
  const statusLabel = product.status === 'sold' ? '已售出' : product.status === 'reserved' ? '已预留' : '在售'
  const isSold = product.status === 'sold' || product.status === 'reserved'

  return (
    <div className="product-detail">
      {/* Back button - floating */}
      <button className="detail-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeftOutlined />
      </button>

      <div className={`detail-layout ${isPC ? 'detail-layout-pc' : 'detail-layout-mobile'}`}>
        {/* Left: Image Gallery */}
        <section className="detail-gallery">
          <div className="gallery-main">
            {product.images.length > 0 ? (
              <>
                <div
                  className="gallery-viewport"
                  onTouchStart={(e) => {
                    const touch = e.touches[0]
                    ;(e.currentTarget as any)._touchStartX = touch.clientX
                  }}
                  onTouchEnd={(e) => {
                    const touch = e.changedTouches[0]
                    const startX = (e.currentTarget as any)._touchStartX || 0
                    const diff = touch.clientX - startX
                    if (Math.abs(diff) > 50) {
                      if (diff < 0) {
                        setCurrentImageIndex(prev => Math.min(prev + 1, product.images.length - 1))
                      } else {
                        setCurrentImageIndex(prev => Math.max(prev - 1, 0))
                      }
                    }
                  }}
                >
                  <div
                    className="gallery-track"
                    style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                  >
                    {product.images.map((img, index) => (
                      <div key={index} className="gallery-slide">
                        <img
                          src={img}
                          alt={`${product.title} - 图${index + 1}`}
                          onLoad={() => setImageLoaded(prev => ({ ...prev, [index]: true }))}
                          style={{ opacity: imageLoaded[index] ? 1 : 0 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {product.images.length > 1 && (
                  <>
                    <button
                      className="gallery-nav gallery-nav-prev"
                      onClick={() => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : product.images.length - 1))}
                      style={{ opacity: currentImageIndex === 0 ? 0.3 : 1 }}
                    >
                      ‹
                    </button>
                    <button
                      className="gallery-nav gallery-nav-next"
                      onClick={() => setCurrentImageIndex(prev => (prev < product.images.length - 1 ? prev + 1 : 0))}
                      style={{ opacity: currentImageIndex === product.images.length - 1 ? 0.3 : 1 }}
                    >
                      ›
                    </button>
                    <div className="gallery-counter">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="gallery-empty">
                <img src={product.coverImage} alt={product.title} />
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="gallery-thumbnails">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === currentImageIndex ? 'thumbnail-active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img src={img} alt={`缩略图 ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right: Product Info */}
        <section className="detail-info">
          {/* Status badge */}
          {isSold && (
            <div className={`status-badge status-${product.status}`}>
              {statusLabel}
            </div>
          )}

          {/* Category */}
          <span className="detail-category">{product.categoryName}</span>

          {/* Title */}
          <h1 className="detail-title">{product.title}</h1>

          {/* Price section */}
          <div className="detail-price-section">
            <span className="detail-price">¥{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="detail-original-price">¥{product.originalPrice}</span>
            )}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="detail-discount">
                {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Quick stats */}
          <div className="detail-quick-stats">
            <div className="stat-item">
              <EyeOutlined />
              <span>{product.viewCount} 浏览</span>
            </div>
            <div className="stat-item">
              <HeartOutlined />
              <span>{favoriteCount} 收藏</span>
            </div>
            <div className="stat-item">
              <EnvironmentOutlined />
              <span>{product.location}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="detail-divider" />

          {/* Condition & Trade Type */}
          <div className="detail-attributes">
            <div className="attribute-row">
              <span className="attribute-label">成色</span>
              <span className="attribute-value">
                <span className="condition-dot" style={{ backgroundColor: condition.color }} />
                {condition.label}
              </span>
            </div>
            <div className="attribute-row">
              <span className="attribute-label">交易方式</span>
              <span className="attribute-value">{tradeType.icon} {tradeType.label}</span>
            </div>
            <div className="attribute-row">
              <span className="attribute-label">发布时间</span>
              <span className="attribute-value">
                {new Date(product.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="detail-description">
            <h3 className="description-title">商品描述</h3>
            <p className="description-content">{product.description}</p>
          </div>

          {/* Seller Card */}
          <div className="seller-card" onClick={() => navigate(`/user/${product.sellerId}`)}>
            <Avatar size={48} src={product.sellerAvatar} className="seller-avatar">
              {product.sellerName?.charAt(0)}
            </Avatar>
            <div className="seller-details">
              <div className="seller-name-row">
                <span className="seller-name">{product.sellerName}</span>
                {product.sellerCreditScore >= 80 && (
                  <SafetyCertificateOutlined className="seller-verified" />
                )}
              </div>
              <div className="seller-meta">
                {product.sellerSchool && <span className="seller-school">{product.sellerSchool}</span>}
                <span className="seller-credit">信用分 {product.sellerCreditScore}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons - PC */}
          {isPC && (
            <div className="detail-actions">
              {!isOwner ? (
                <>
                  <Button
                    className="action-btn action-chat"
                    icon={<MessageOutlined />}
                    onClick={handleChat}
                    disabled={isSold}
                  >
                    联系卖家
                  </Button>
                  <Button
                    className="action-btn action-buy"
                    type="primary"
                    onClick={handleBuy}
                    loading={orderLoading}
                    disabled={isSold}
                  >
                    {isSold ? statusLabel : '立即购买'}
                  </Button>
                  <Button
                    className="action-btn action-fav"
                    icon={favorited ? <HeartFilled /> : <HeartOutlined />}
                    onClick={handleFavorite}
                  />
                  <Button
                    className="action-btn action-share"
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                  />
                </>
              ) : (
                <Button
                  className="action-btn action-chat"
                  icon={<MessageOutlined />}
                  onClick={() => navigate('/chat')}
                >
                  查看消息
                </Button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Mobile Bottom Action Bar */}
      {!isPC && (
        <div className="mobile-action-bar">
          <button className="mobile-action-icon" onClick={handleFavorite}>
            {favorited ? <HeartFilled style={{ color: '#FF3B30' }} /> : <HeartOutlined />}
          </button>
          <button className="mobile-action-icon" onClick={handleShare}>
            <ShareAltOutlined />
          </button>
          {!isOwner ? (
            <>
              <button
                className="mobile-action-btn mobile-chat-btn"
                onClick={handleChat}
                disabled={isSold}
              >
                <MessageOutlined /> 联系卖家
              </button>
              <button
                className="mobile-action-btn mobile-buy-btn"
                onClick={handleBuy}
                disabled={isSold}
              >
                {isSold ? statusLabel : '立即购买'}
              </button>
            </>
          ) : (
            <button
              className="mobile-action-btn mobile-chat-btn"
              onClick={() => navigate('/chat')}
              style={{ flex: 1 }}
            >
              <MessageOutlined /> 查看消息
            </button>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        title={null}
        open={payModalVisible}
        onCancel={handlePayLater}
        footer={null}
        width={420}
        centered
        className="pay-modal"
        maskClosable={false}
      >
        <div className="pay-modal-content">
          <div className="pay-modal-header">
            <DollarOutlined className="pay-icon" />
            <h2>确认支付</h2>
            <p className="pay-subtitle">订单创建成功，请完成支付</p>
          </div>

          <div className="pay-amount-section">
            <span className="pay-amount-label">支付金额</span>
            <span className="pay-amount-value">¥{product?.price}</span>
          </div>

          <div className="pay-product-info">
            <img src={product?.coverImage} alt={product?.title} className="pay-product-img" />
            <div className="pay-product-detail">
              <div className="pay-product-title">{product?.title}</div>
              <div className="pay-product-seller">卖家：{product?.sellerName}</div>
            </div>
          </div>

          <div className="pay-method-section">
            <div className="pay-method-label">选择支付方式</div>
            <Radio.Group
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="pay-method-group"
            >
              <Radio value="alipay" className="pay-method-item">
                <AlipayCircleOutlined style={{ color: '#1677FF', fontSize: 20, marginRight: 8 }} />
                支付宝
              </Radio>
              <Radio value="wechat" className="pay-method-item">
                <WechatOutlined style={{ color: '#07C160', fontSize: 20, marginRight: 8 }} />
                微信支付
              </Radio>
              <Radio value="balance" className="pay-method-item">
                <DollarOutlined style={{ color: '#FAAD14', fontSize: 20, marginRight: 8 }} />
                余额支付
              </Radio>
            </Radio.Group>
          </div>

          <div className="pay-password-section">
            <div className="pay-password-label">
              <LockOutlined /> 支付密码
            </div>
            <Input.Password
              placeholder="请输入支付密码"
              value={payPassword}
              onChange={(e) => setPayPassword(e.target.value)}
              className="pay-password-input"
              onPressEnter={handlePay}
            />
          </div>

          <div className="pay-actions">
            <Button
              type="primary"
              size="large"
              block
              onClick={handlePay}
              loading={payLoading}
              className="pay-confirm-btn"
            >
              确认支付 ¥{product?.price}
            </Button>
            <Button
              size="large"
              block
              onClick={handlePayLater}
              className="pay-later-btn"
            >
              稍后支付
            </Button>
          </div>

          <div className="pay-security-hint">
            <SafetyCertificateOutlined /> 支付环境安全，请放心支付
          </div>
        </div>
      </Modal>
    </div>
  )
}
