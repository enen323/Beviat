import React, { useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Avatar, Badge, Button, Dropdown } from 'antd'
import {
  MessageOutlined,
  BellOutlined,
  UserOutlined,
  StarOutlined,
  ShoppingOutlined,
  SettingOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { useUserStore } from '@/stores/user'
import CardNav from '@/components/CardNav'
import './PCLayout.scss'

const searchNavItems = [
  {
    label: '热门分类',
    bgColor: '#3B82F6',
    textColor: '#fff',
    links: [
      { label: '书籍资料', ariaLabel: '搜索书籍资料', href: '/?category=1' },
      { label: '电子产品', ariaLabel: '搜索电子产品', href: '/?category=2' },
      { label: '生活用品', ariaLabel: '搜索生活用品', href: '/?category=3' },
      { label: '运动健身', ariaLabel: '搜索运动健身', href: '/?category=4' },
    ],
  },
  {
    label: '更多分类',
    bgColor: '#8B5CF6',
    textColor: '#fff',
    links: [
      { label: '服装饰品', ariaLabel: '搜索服装饰品', href: '/?category=5' },
      { label: '美妆护肤', ariaLabel: '搜索美妆护肤', href: '/?category=6' },
      { label: '食品零食', ariaLabel: '搜索食品零食', href: '/?category=7' },
    ],
  },
  {
    label: '快捷入口',
    bgColor: '#1D1D1F',
    textColor: '#fff',
    links: [
      { label: '拍卖专场', ariaLabel: '前往拍卖', href: '/auction' },
      { label: '社区话题', ariaLabel: '前往社区', href: '/community' },
      { label: '发布商品', ariaLabel: '发布商品', href: '/product/publish' },
    ],
  },
]

const searchSuggestions = [
  { label: '二手教材', href: '/?keyword=二手教材' },
  { label: 'iPhone', href: '/?keyword=iPhone' },
  { label: '笔记本电脑', href: '/?keyword=笔记本电脑' },
  { label: '自行车', href: '/?keyword=自行车' },
  { label: '考研资料', href: '/?keyword=考研资料' },
  { label: '耳机', href: '/?keyword=耳机' },
  { label: '台灯', href: '/?keyword=台灯' },
  { label: '运动鞋', href: '/?keyword=运动鞋' },
]

const PCLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userInfo, isLoggedIn, logout } = useUserStore()
  const [unreadCount] = useState(0)
  const [notificationCount] = useState(0)

  const handleSearch = useCallback(
    (keyword: string) => {
      if (keyword.trim()) {
        navigate({ pathname: '/', search: `?keyword=${keyword.trim()}` })
      }
    },
    [navigate]
  )

  const handleSuggestionSelect = useCallback(
    (item: { label: string; href?: string; onClick?: () => void }) => {
      if (item.href) {
        navigate(item.href)
      }
    },
    [navigate]
  )

  function handleMenuClick(key: string) {
    switch (key) {
      case 'profile':
        navigate('/user')
        break
      case 'orders':
        navigate('/orders')
        break
      case 'favorites':
        navigate('/user?tab=favorites')
        break
      case 'myProducts':
        navigate('/user?tab=products')
        break
      case 'settings':
        navigate('/user/settings')
        break
      case 'logout':
        logout()
        navigate('/')
        break
    }
  }

  const dropdownItems = isLoggedIn
    ? [
        { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
        { key: 'orders', icon: <ShoppingCartOutlined />, label: '我的订单' },
        { key: 'favorites', icon: <StarOutlined />, label: '我的收藏' },
        { key: 'myProducts', icon: <ShoppingOutlined />, label: '我的发布' },
        { key: 'settings', icon: <SettingOutlined />, label: '设置' },
        { type: 'divider' as const },
        { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
      ]
    : []

  return (
    <div className="pc-layout">
      <header className="pc-header glass">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="logo-text">Beviat</span>
          </div>

          <nav className="nav-menu">
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
              首页
            </Link>
            <Link to="/auction" className={`nav-item ${location.pathname === '/auction' ? 'active' : ''}`}>
              拍卖
            </Link>
            <Link to="/community" className={`nav-item ${location.pathname === '/community' ? 'active' : ''}`}>
              社区
            </Link>
            {isLoggedIn && (
              <Link to="/orders" className={`nav-item ${location.pathname === '/orders' ? 'active' : ''}`}>
                订单
              </Link>
            )}
          </nav>

          {/* React Bits CardNav Search */}
          <div className="header-search">
            <CardNav
              items={searchNavItems}
              onSearch={handleSearch}
              suggestions={searchSuggestions}
              onSuggestionSelect={handleSuggestionSelect}
              searchPlaceholder="搜索商品、用户、话题..."
              baseColor="rgba(255,255,255,0.95)"
              menuColor="#1D1D1F"
              buttonBgColor="#0071e3"
              buttonTextColor="#fff"
              ease="power3.out"
            />
          </div>

          <div className="header-actions">
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<MessageOutlined />} onClick={() => navigate('/chat')} />
            </Badge>

            <Badge count={notificationCount} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>

            {isLoggedIn ? (
              <Dropdown
                menu={{ items: dropdownItems, onClick: ({ key }) => handleMenuClick(key) }}
                trigger={['click']}
                popupRender={(menu) => (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <Avatar size={44} src={userInfo?.avatar} icon={<UserOutlined />}>
                        {userInfo?.nickname?.charAt(0)}
                      </Avatar>
                      <div className="user-dropdown-info">
                        <span className="user-nickname">{userInfo?.nickname}</span>
                        <span className="user-school">{userInfo?.school || '未设置学校'}</span>
                      </div>
                    </div>
                    <div className="user-dropdown-stats">
                      <div className="stat-item">
                        <span className="stat-value">{userInfo?.creditScore ?? '-'}</span>
                        <span className="stat-label">信用分</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{userInfo?.school || '-'}</span>
                        <span className="stat-label">学校</span>
                      </div>
                    </div>
                    {menu}
                  </div>
                )}
              >
                <div className="user-avatar" style={{ cursor: 'pointer' }}>
                  <Avatar size={32} src={userInfo?.avatar} icon={<UserOutlined />}>
                    {userInfo?.nickname?.charAt(0)}
                  </Avatar>
                </div>
              </Dropdown>
            ) : (
              <Button type="primary" onClick={() => navigate('/auth/login')}>
                登录
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="pc-main">
        {children}
      </main>

      <footer className="pc-footer">
        <div className="footer-content">
          <p>© 2024 Beviat. 让闲置流动起来</p>
        </div>
      </footer>
    </div>
  )
}

export default PCLayout
