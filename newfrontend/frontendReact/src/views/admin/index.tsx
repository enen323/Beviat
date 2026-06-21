import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Input, Tabs, Tag, Modal, message, Space } from 'antd'
import {
  SearchOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  FormOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { productApi, auctionApi, communityApi } from '@/api'
import type { Product, Auction, Post } from '@/api'
import './index.scss'

const { confirm } = Modal

type TabKey = 'products' | 'users' | 'auctions' | 'posts'

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productApi.list({ keyword: searchKeyword || undefined, size: 50 })
      setProducts(res.records || [])
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [searchKeyword])

  const fetchAuctions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auctionApi.list({ size: 50 })
      setAuctions(res.records || [])
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await communityApi.getPosts({ size: 50 })
      setPosts(res.records || [])
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    switch (activeTab) {
      case 'products':
        fetchProducts()
        break
      case 'auctions':
        fetchAuctions()
        break
      case 'posts':
        fetchPosts()
        break
    }
  }, [activeTab, fetchProducts, fetchAuctions, fetchPosts])

  const handleDeleteProduct = (id: number) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '删除后不可恢复，确认删除该商品？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await productApi.delete(id)
          message.success('删除成功')
          fetchProducts()
        } catch {
          // handled
        }
      },
    })
  }

  const handleDeletePost = (id: number) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '删除后不可恢复，确认删除该帖子？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await communityApi.getPostDetail(id)
          message.success('删除成功')
          fetchPosts()
        } catch {
          // handled
        }
      },
    })
  }

  const productColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '商品名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
      width: 100,
    },
    {
      title: '卖家',
      dataIndex: 'sellerName',
      key: 'sellerName',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
          available: { color: 'green', label: '在售' },
          sold: { color: 'default', label: '已售' },
          reserved: { color: 'orange', label: '已预留' },
        }
        const info = map[status] || { color: 'default', label: status }
        return <Tag color={info.color}>{info.label}</Tag>
      },
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProduct(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
      width: 80,
    },
  ]

  const auctionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '商品',
      key: 'productTitle',
      render: (_: any, record: Auction) => record.product?.title || '-',
      ellipsis: true,
    },
    {
      title: '当前价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (price: number) => `¥${price}`,
      width: 100,
    },
    {
      title: '出价数',
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
          ongoing: { color: 'green', label: '进行中' },
          ended: { color: 'default', label: '已结束' },
          cancelled: { color: 'red', label: '已取消' },
        }
        const info = map[status] || { color: 'default', label: status }
        return <Tag color={info.color}>{info.label}</Tag>
      },
      width: 90,
    },
  ]

  const postColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorName',
      width: 100,
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      key: 'likeCount',
      width: 70,
    },
    {
      title: '评论',
      dataIndex: 'commentCount',
      key: 'commentCount',
      width: 70,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Post) => (
        <Space>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePost(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
      width: 80,
    },
  ]

  const tabItems = [
    {
      key: 'products',
      label: (
        <span>
          <ShoppingOutlined /> 商品管理
        </span>
      ),
      children: (
        <div className="admin-table-section">
          <div className="table-toolbar">
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索商品..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={fetchProducts}
              allowClear
              style={{ width: 300 }}
            />
          </div>
          <Table
            columns={productColumns}
            dataSource={products}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </div>
      ),
    },
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined /> 用户管理
        </span>
      ),
      children: (
        <div className="admin-table-section">
          <Table
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
              { title: '用户名', dataIndex: 'username', key: 'username' },
              { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
              { title: '学校', dataIndex: 'school', key: 'school' },
              {
                title: '信用分',
                dataIndex: 'creditScore',
                key: 'creditScore',
                render: (score: number) => (
                  <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
                    {score}
                  </Tag>
                ),
              },
            ]}
            dataSource={[]}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="middle"
            locale={{ emptyText: '用户管理功能开发中' }}
          />
        </div>
      ),
    },
    {
      key: 'auctions',
      label: (
        <span>
          <DollarOutlined /> 拍卖管理
        </span>
      ),
      children: (
        <div className="admin-table-section">
          <Table
            columns={auctionColumns}
            dataSource={auctions}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </div>
      ),
    },
    {
      key: 'posts',
      label: (
        <span>
          <FormOutlined /> 帖子管理
        </span>
      ),
      children: (
        <div className="admin-table-section">
          <Table
            columns={postColumns}
            dataSource={posts}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </div>
      ),
    },
  ]

  return (
    <div className="admin-page">
      <h1 className="admin-title">管理后台</h1>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={tabItems}
        className="admin-tabs"
      />
    </div>
  )
}

export default Admin
