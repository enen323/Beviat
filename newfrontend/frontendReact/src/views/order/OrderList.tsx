import { useState, useEffect } from 'react'
import { Tabs, Card, Tag, Avatar, Empty, Spin, Button, message } from 'antd'
import { ShoppingOutlined, ShopOutlined, EnvironmentOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { orderApi, type Order } from '@/api'
import { useUserStore } from '@/stores/user'
import './OrderList.scss'

const statusConfig: Record<number, { text: string; color: string }> = {
  0: { text: '待支付', color: 'orange' },
  1: { text: '待卖家确认', color: 'blue' },
  2: { text: '待发货', color: 'cyan' },
  3: { text: '已发货', color: 'geekblue' },
  4: { text: '已完成', color: 'green' },
  5: { text: '已取消', color: 'default' },
  6: { text: '已退款', color: 'red' },
}

export default function OrderList() {
  const navigate = useNavigate()
  const { isLoggedIn, userId } = useUserStore()
  const [activeTab, setActiveTab] = useState('buy')
  const [buyOrders, setBuyOrders] = useState<Order[]>([])
  const [sellOrders, setSellOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/auth/login')
      return
    }
    fetchOrders()
  }, [isLoggedIn])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const [buy, sell] = await Promise.all([
        orderApi.getBuyOrders(),
        orderApi.getSellOrders(),
      ])
      setBuyOrders(buy)
      setSellOrders(sell)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  const renderOrderCard = (order: Order, isBuyer: boolean) => {
    const statusInfo = statusConfig[order.status] || { text: '未知', color: 'default' }
    const peerName = isBuyer ? order.sellerName : order.buyerName
    const peerAvatar = isBuyer ? order.sellerAvatar : order.buyerAvatar

    return (
      <Card
        key={order.id}
        className="order-card glass-card"
        hoverable
        onClick={() => navigate(`/order/${order.id}`)}
      >
        <div className="order-card-inner">
          <div className="order-product">
            <img src={order.productImage} alt={order.productTitle} className="order-product-image" />
            <div className="order-product-info">
              <div className="order-product-title">{order.productTitle}</div>
              <div className="order-product-price">¥{order.orderAmount}</div>
            </div>
          </div>
          <div className="order-meta">
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
            <div className="order-peer">
              <Avatar size={20} src={peerAvatar} />
              <span>{isBuyer ? '卖家' : '买家'}: {peerName}</span>
            </div>
            {order.status === 3 && (order.buyerLatitude || order.sellerLatitude) && (
              <div className="order-location-hint">
                <EnvironmentOutlined /> 可查看双方位置
              </div>
            )}
            <div className="order-time">{order.createdAt?.replace('T', ' ').slice(0, 16)}</div>
          </div>
        </div>
      </Card>
    )
  }

  const tabItems = [
    {
      key: 'buy',
      label: (
        <span>
          <ShoppingOutlined /> 我买到的
        </span>
      ),
      children: loading ? (
        <div className="order-loading"><Spin /></div>
      ) : buyOrders.length === 0 ? (
        <Empty description="暂无购买订单" />
      ) : (
        <div className="order-list">
          {buyOrders.map((order) => renderOrderCard(order, true))}
        </div>
      ),
    },
    {
      key: 'sell',
      label: (
        <span>
          <ShopOutlined /> 我卖出的
        </span>
      ),
      children: loading ? (
        <div className="order-loading"><Spin /></div>
      ) : sellOrders.length === 0 ? (
        <Empty description="暂无出售订单" />
      ) : (
        <div className="order-list">
          {sellOrders.map((order) => renderOrderCard(order, false))}
        </div>
      ),
    },
  ]

  return (
    <div className="order-list-page">
      <div className="order-list-inner">
        <h1 className="page-title">我的订单</h1>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          centered
        />
      </div>
    </div>
  )
}
