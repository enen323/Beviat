import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, InputNumber, Tag, Avatar, Spin, Empty, Carousel, message } from 'antd'
import {
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  HistoryOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { auctionApi } from '@/api'
import type { Auction, Bid } from '@/api'
import { useUserStore } from '@/stores/user'
import './Detail.scss'

function formatEndTime(endTime: string): string {
  const end = new Date(endTime).getTime()
  const now = Date.now()
  const diff = end - now
  if (diff <= 0) return '已结束'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

const conditionLabels: Record<number, string> = {
  1: '全新',
  2: '几乎全新',
  3: '轻微使用痕迹',
  4: '明显使用痕迹',
  5: '重度使用',
}

const AuctionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoggedIn } = useUserStore()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const [auctionData, bidsData] = await Promise.all([
          auctionApi.detail(Number(id)),
          auctionApi.getBids(Number(id)),
        ])
        setAuction(auctionData)
        setBids(bidsData)
        if (auctionData) {
          setBidAmount(auctionData.currentPrice + auctionData.minIncrement)
        }
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handlePlaceBid = async () => {
    if (!auction || !id) return
    if (bidAmount < auction.currentPrice + auction.minIncrement) {
      message.warning(`出价不能低于 ¥${auction.currentPrice + auction.minIncrement}`)
      return
    }
    setSubmitting(true)
    try {
      const newBid = await auctionApi.placeBid(auction.id, bidAmount)
      setBids((prev) => [newBid, ...prev])
      setAuction((prev) =>
        prev ? { ...prev, currentPrice: bidAmount, bidCount: prev.bidCount + 1 } : prev
      )
      setBidAmount(bidAmount + auction.minIncrement)
      message.success('出价成功！')
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="auction-detail-loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="auction-detail-loading">
        <Empty description="拍卖不存在" />
      </div>
    )
  }

  const isOngoing = auction.status === 'ongoing'
  const product = auction.product

  return (
    <div className="auction-detail">
      <div className="auction-detail-back">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/auction')}
        >
          返回拍卖列表
        </Button>
      </div>

      <div className="auction-detail-layout">
        {/* Left: Product Info */}
        <div className="auction-detail-product">
          <div className="product-images">
            {product?.images && product.images.length > 0 ? (
              <Carousel autoplay dots={{ className: 'carousel-dots' }}>
                {product.images.map((img, idx) => (
                  <div key={idx} className="product-image-item">
                    <img src={img} alt={`${product.title} - ${idx + 1}`} />
                  </div>
                ))}
              </Carousel>
            ) : (
              <div className="product-image-placeholder">
                <DollarOutlined style={{ fontSize: 48, color: '#ccc' }} />
              </div>
            )}
          </div>

          <div className="product-info-section">
            <h1 className="product-title">{product?.title}</h1>
            {product?.description && (
              <p className="product-description">{product.description}</p>
            )}
            {product?.conditionLevel && (
              <div className="product-condition">
                <span className="label">成色：</span>
                <Tag>{conditionLabels[product.conditionLevel] || '未知'}</Tag>
              </div>
            )}
          </div>
        </div>

        {/* Right: Auction Info */}
        <div className="auction-detail-info">
          <div className="auction-status-card glass-card">
            <div className="status-header">
              <Tag color={isOngoing ? 'green' : 'default'} className="status-badge">
                {isOngoing ? '进行中' : '已结束'}
              </Tag>
              {isOngoing && (
                <span className="countdown">
                  <ClockCircleOutlined /> {formatEndTime(auction.endTime)}
                </span>
              )}
            </div>

            <div className="price-section">
              <div className="current-price-row">
                <span className="label">当前价格</span>
                <span className="current-price">¥{auction.currentPrice}</span>
              </div>
              <div className="start-price-row">
                <span className="label">起拍价格</span>
                <span className="start-price">¥{auction.startPrice}</span>
              </div>
              <div className="bid-info-row">
                <span className="label">最低加价</span>
                <span className="min-increment">¥{auction.minIncrement}</span>
              </div>
              <div className="bid-info-row">
                <span className="label">出价次数</span>
                <span className="bid-count">{auction.bidCount}</span>
              </div>
            </div>

            {isOngoing && isLoggedIn && (
              <div className="bid-action">
                <InputNumber
                  value={bidAmount}
                  onChange={(val) => setBidAmount(val || 0)}
                  min={auction.currentPrice + auction.minIncrement}
                  step={auction.minIncrement}
                  prefix="¥"
                  style={{ width: '100%' }}
                  size="large"
                />
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  onClick={handlePlaceBid}
                  block
                  className="bid-btn"
                >
                  立即出价
                </Button>
              </div>
            )}

            {isOngoing && !isLoggedIn && (
              <div className="bid-login-hint">
                <Button type="primary" onClick={() => navigate('/auth/login')} block>
                  登录后出价
                </Button>
              </div>
            )}
          </div>

          {/* Bid History */}
          <div className="bid-history glass-card">
            <h3 className="bid-history-title">
              <HistoryOutlined /> 出价记录
            </h3>
            {bids.length === 0 ? (
              <Empty description="暂无出价" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className="bid-list">
                {bids.map((bid, idx) => (
                  <div key={bid.id} className={`bid-item ${idx === 0 ? 'highest' : ''}`}>
                    <div className="bid-user">
                      <Avatar size={28} src={bid.bidderAvatar} icon={<UserOutlined />}>
                        {bid.bidderName?.charAt(0)}
                      </Avatar>
                      <span className="bidder-name">{bid.bidderName}</span>
                      {idx === 0 && <Tag color="gold" className="highest-tag">最高价</Tag>}
                    </div>
                    <div className="bid-amount-time">
                      <span className="bid-amount">¥{bid.amount}</span>
                      <span className="bid-time">
                        {new Date(bid.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuctionDetail
