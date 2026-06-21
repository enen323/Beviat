import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Avatar, Tag, Button, Steps, Spin, Empty, message, Modal } from 'antd'
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CarOutlined,
  DollarOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { orderApi, type Order } from '@/api'
import { useUserStore } from '@/stores/user'
import AmapComponent from '@/components/AmapComponent'
import './OrderDetail.scss'

const statusConfig: Record<number, { text: string; color: string; step: number }> = {
  0: { text: '待支付', color: 'orange', step: 0 },
  1: { text: '待卖家确认', color: 'blue', step: 1 },
  2: { text: '待发货', color: 'cyan', step: 2 },
  3: { text: '已发货', color: 'geekblue', step: 3 },
  4: { text: '已完成', color: 'green', step: 4 },
  5: { text: '已取消', color: 'default', step: -1 },
  6: { text: '已退款', color: 'red', step: -1 },
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userId } = useUserStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [shipModalVisible, setShipModalVisible] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [sellerLocation, setSellerLocation] = useState<{ lng: number; lat: number; address: string } | null>(null)
  const [confirmSellerLocation, setConfirmSellerLocation] = useState<{ lng: number; lat: number; address: string } | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await orderApi.getDetail(Number(id))
      setOrder(data)
    } catch {
      message.error('获取订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="order-detail-loading"><Spin size="large" /></div>
  }

  if (!order) {
    return <div className="order-detail-loading"><Empty description="订单不存在" /></div>
  }

  const isBuyer = order.buyerId === userId
  const isSeller = order.sellerId === userId
  const statusInfo = statusConfig[order.status] || { text: '未知', color: 'default', step: -1 }

  // 构建地图标记点 - 买家蓝色，卖家红色
  const mapMarkers: Array<{ lng: number; lat: number; label: string; color: string; role: 'buyer' | 'seller' }> = []
  if (order.sellerLatitude && order.sellerLongitude) {
    mapMarkers.push({
      lng: Number(order.sellerLongitude),
      lat: Number(order.sellerLatitude),
      label: `卖家: ${order.sellerName}`,
      color: '#ff4d4f',
      role: 'seller',
    })
  }
  if (order.buyerLatitude && order.buyerLongitude) {
    mapMarkers.push({
      lng: Number(order.buyerLongitude),
      lat: Number(order.buyerLatitude),
      label: `买家: ${order.buyerName}`,
      color: '#1677ff',
      role: 'buyer',
    })
  }

  // 卖家确认接单后即可显示地图（status >= 1 且有位置数据）
  const showMap = order.status >= 1 && mapMarkers.length > 0

  const handlePay = async () => {
    setActionLoading(true)
    try {
      await orderApi.pay(order.id)
      message.success('支付成功，等待卖家确认')
      fetchOrder()
    } catch (e: any) {
      message.error(e?.message || '支付失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirm = async () => {
    setActionLoading(true)
    try {
      await orderApi.confirm(order.id, confirmSellerLocation?.lat, confirmSellerLocation?.lng, confirmSellerLocation?.address)
      message.success('已确认订单')
      setConfirmModalVisible(false)
      setConfirmSellerLocation(null)
      fetchOrder()
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleShip = async () => {
    setActionLoading(true)
    try {
      await orderApi.ship(order.id, sellerLocation?.lat, sellerLocation?.lng, sellerLocation?.address)
      message.success('发货成功')
      setShipModalVisible(false)
      fetchOrder()
    } catch (e: any) {
      message.error(e?.message || '发货失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      await orderApi.cancel(order.id)
      message.success('订单已取消')
      fetchOrder()
    } catch (e: any) {
      message.error(e?.message || '取消失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    setActionLoading(true)
    try {
      await orderApi.complete(order.id)
      message.success('已确认收货')
      fetchOrder()
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSellerLocationPick = (loc: { lng: number; lat: number; address: string }) => {
    setSellerLocation({ lng: loc.lng, lat: loc.lat, address: loc.address })
  }

  const handleConfirmLocationPick = (loc: { lng: number; lat: number; address: string }) => {
    setConfirmSellerLocation({ lng: loc.lng, lat: loc.lat, address: loc.address })
  }

  // 订单步骤
  const stepItems = [
    { title: '提交订单', description: order.createdAt?.replace('T', ' ').slice(0, 16) },
    { title: '买家付款', description: order.paidAt?.replace('T', ' ').slice(0, 16) },
    { title: '卖家确认', description: order.confirmedAt?.replace('T', ' ').slice(0, 16) },
    { title: '卖家发货', description: order.shippedAt?.replace('T', ' ').slice(0, 16) },
    { title: '交易完成', description: order.completedAt?.replace('T', ' ').slice(0, 16) },
  ]

  return (
    <div className="order-detail-page">
      <div className="order-detail-inner">
        {/* 返回按钮和标题 */}
        <div className="order-header">
          <ArrowLeftOutlined onClick={() => navigate(-1)} style={{ fontSize: 20, cursor: 'pointer' }} />
          <h1>订单详情</h1>
          <Tag color={statusInfo.color} className="status-tag">{statusInfo.text}</Tag>
        </div>

        {/* 订单进度 */}
        {order.status !== 5 && order.status !== 6 && (
          <div className="order-steps glass-card">
            <Steps current={statusInfo.step} items={stepItems} size="small" />
          </div>
        )}

        {/* 商品信息 */}
        <div className="order-product-card glass-card">
          <img src={order.productImage} alt={order.productTitle} className="product-image" />
          <div className="product-info">
            <div className="product-title">{order.productTitle}</div>
            <div className="product-price">¥{order.orderAmount}</div>
          </div>
          <div className="product-actions">
            <Button type="link" onClick={() => navigate(`/product/${order.productId}`)}>查看商品</Button>
          </div>
        </div>

        {/* 交易双方信息 */}
        <div className="order-parties glass-card">
          <div className="party buyer">
            <Avatar src={order.buyerAvatar} size={40} />
            <div className="party-info">
              <div className="party-role">买家</div>
              <div className="party-name">{order.buyerName}</div>
              {order.buyerAddress && <div className="party-address"><EnvironmentOutlined /> {order.buyerAddress}</div>}
            </div>
          </div>
          <div className="party-divider">
            <CarOutlined />
          </div>
          <div className="party seller">
            <Avatar src={order.sellerAvatar} size={40} />
            <div className="party-info">
              <div className="party-role">卖家</div>
              <div className="party-name">{order.sellerName}</div>
              {order.sellerAddress && <div className="party-address"><EnvironmentOutlined /> {order.sellerAddress}</div>}
            </div>
          </div>
        </div>

        {/* 收货信息（买家信息） */}
        <div className="order-receiver glass-card">
          <h3>买家信息</h3>
          <div className="receiver-row">
            <span className="label">买家</span>
            <span>{order.receiverName || order.buyerName || '-'}</span>
          </div>
          <div className="receiver-row">
            <span className="label">手机号</span>
            <span>{order.receiverPhone || '-'}</span>
          </div>
          <div className="receiver-row">
            <span className="label">地址</span>
            <span>{order.receiverAddress || order.buyerAddress || '-'}</span>
          </div>
          {order.remark && (
            <div className="receiver-row">
              <span className="label">备注</span>
              <span>{order.remark}</span>
            </div>
          )}
        </div>

        {/* 地图区域 - 卖家确认后显示位置 */}
        {showMap && (
          <div className="order-map glass-card">
            <h3><EnvironmentOutlined /> {mapMarkers.length > 1 ? '双方位置' : mapMarkers[0]?.role === 'buyer' ? '买家位置' : '卖家位置'}</h3>
            <AmapComponent
              height={350}
              markers={mapMarkers}
              showSearch={false}
              showGeolocation={false}
              pickable={false}
              showRoute={mapMarkers.length >= 2}
            />
          </div>
        )}

        {/* 操作按钮区 */}
        <div className="order-actions glass-card">
          {/* 买家操作 */}
          {isBuyer && order.status === 0 && (
            <div className="action-group">
              <Button type="primary" size="large" onClick={handlePay} loading={actionLoading} block>
                <DollarOutlined /> 立即支付
              </Button>
              <Button size="large" onClick={handleCancel} loading={actionLoading} block>
                取消订单
              </Button>
            </div>
          )}
          {isBuyer && order.status === 3 && (
            <div className="action-group">
              <Button type="primary" size="large" onClick={handleComplete} loading={actionLoading} block>
                <CheckCircleOutlined /> 确认收货
              </Button>
            </div>
          )}

          {/* 卖家操作 */}
          {isSeller && order.status === 1 && (
            <div className="action-group">
              <Button type="primary" size="large" onClick={() => setConfirmModalVisible(true)} block>
                <CheckCircleOutlined /> 同意订单
              </Button>
              <Button danger size="large" onClick={handleCancel} loading={actionLoading} block>
                <CloseOutlined /> 拒绝订单
              </Button>
            </div>
          )}
          {isSeller && order.status === 2 && (
            <div className="action-group">
              <Button type="primary" size="large" onClick={() => setShipModalVisible(true)} block>
                <CarOutlined /> 发货
              </Button>
            </div>
          )}

          {/* 已取消/已退款 */}
          {(order.status === 5 || order.status === 6) && (
            <div className="action-group">
              <div className="order-cancel-info">
                {order.cancelReason || (order.status === 5 ? '订单已取消' : '订单已退款')}
              </div>
            </div>
          )}

          {/* 已完成 */}
          {order.status === 4 && (
            <div className="action-group">
              <div className="order-complete-info">
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 交易已完成
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 发货弹窗 - 包含地图选点 */}
      <Modal
        title="确认发货"
        open={shipModalVisible}
        onOk={handleShip}
        onCancel={() => setShipModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认发货"
        cancelText="取消"
        width={600}
      >
        <div className="ship-modal-content">
          <p className="ship-hint">请在地图上选择您的发货位置（点击地图选点），方便买家查看您的位置</p>
          <AmapComponent
            height={300}
            pickable={true}
            onLocationPick={handleSellerLocationPick}
            showSearch={true}
            showGeolocation={true}
          />
          {sellerLocation && (
            <div className="selected-location">
              <EnvironmentOutlined /> {sellerLocation.address || `${sellerLocation.lat?.toFixed(6)}, ${sellerLocation.lng?.toFixed(6)}`}
            </div>
          )}
        </div>
      </Modal>

      {/* 卖家确认接单弹窗 - 包含地图选点 */}
      <Modal
        title="确认接单"
        open={confirmModalVisible}
        onOk={handleConfirm}
        onCancel={() => { setConfirmModalVisible(false); setConfirmSellerLocation(null) }}
        confirmLoading={actionLoading}
        okText="确认接单"
        cancelText="取消"
        width={600}
      >
        <div className="ship-modal-content">
          <p className="ship-hint">请在地图上选择您的位置（点击地图选点），方便买家查看您的位置</p>
          <AmapComponent
            height={300}
            pickable={true}
            onLocationPick={handleConfirmLocationPick}
            showSearch={true}
            showGeolocation={true}
          />
          {confirmSellerLocation && (
            <div className="selected-location">
              <EnvironmentOutlined /> {confirmSellerLocation.address || `${confirmSellerLocation.lat?.toFixed(6)}, ${confirmSellerLocation.lng?.toFixed(6)}`}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
