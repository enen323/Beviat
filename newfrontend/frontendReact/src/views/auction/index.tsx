import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tag, Spin, Empty } from 'antd'
import { ClockCircleOutlined, FireOutlined, PlusOutlined } from '@ant-design/icons'
import { auctionApi } from '@/api'
import type { Auction } from '@/api'
import './index.scss'

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'ongoing', label: '进行中' },
  { key: 'ended', label: '已结束' },
]

function formatEndTime(endTime: string): string {
  const end = new Date(endTime).getTime()
  const now = Date.now()
  const diff = end - now
  if (diff <= 0) return '已结束'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}天${hours}小时后结束`
  if (hours > 0) return `${hours}小时${minutes}分钟后结束`
  return `${minutes}分钟后结束`
}

const AuctionList: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchAuctions = async (pageNum: number, status: string, append = false) => {
    setLoading(true)
    try {
      const params: { status?: number; page: number; size: number } = { page: pageNum, size: 12 }
      if (status === 'ongoing') params.status = 0
      const res = await auctionApi.list(params)
      const list = res.records || []
      setAuctions(append ? (prev) => [...prev, ...list] : list)
      setHasMore(pageNum < res.pages)
    } catch {
      // error handled by request interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchAuctions(1, activeTab)
  }, [activeTab])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchAuctions(nextPage, activeTab, true)
  }

  const statusTagColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'green'
      case 'ended': return 'default'
      case 'cancelled': return 'red'
      default: return 'default'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'ongoing': return '进行中'
      case 'ended': return '已结束'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  return (
    <div className="auction-page">
      <div className="auction-header">
        <h1 className="auction-title">拍卖中心</h1>
        <div className="auction-header-actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/auction/create')}>
            发起拍卖
          </Button>
        </div>
      </div>
      <div className="auction-tabs">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              className={`auction-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

      <Spin spinning={loading && auctions.length === 0}>
        {auctions.length === 0 && !loading ? (
          <Empty description="暂无拍卖商品" />
        ) : (
          <div className="auction-grid">
            {auctions.map((auction) => (
              <div
                key={auction.id}
                className="auction-card glass-card"
                onClick={() => navigate(`/auction/${auction.id}`)}
              >
                <div className="auction-card-image">
                  <img
                    src={auction.product?.coverImage || auction.product?.images?.[0] || ''}
                    alt={auction.product?.title}
                  />
                  <Tag color={statusTagColor(auction.status)} className="auction-status-tag">
                    {statusLabel(auction.status)}
                  </Tag>
                </div>
                <div className="auction-card-body">
                  <h3 className="auction-card-title">{auction.product?.title}</h3>
                  <div className="auction-card-price">
                    <span className="current-price">¥{auction.currentPrice}</span>
                    <span className="start-price">起拍价 ¥{auction.startPrice}</span>
                  </div>
                  <div className="auction-card-meta">
                    <span className="bid-count">
                      <FireOutlined /> {auction.bidCount} 次出价
                    </span>
                    {auction.status === 'ongoing' && (
                      <span className="end-time">
                        <ClockCircleOutlined /> {formatEndTime(auction.endTime)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>

      {hasMore && auctions.length > 0 && (
        <div className="auction-load-more">
          <Button loading={loading} onClick={handleLoadMore} block>
            加载更多
          </Button>
        </div>
      )}
    </div>
  )
}

export default AuctionList
