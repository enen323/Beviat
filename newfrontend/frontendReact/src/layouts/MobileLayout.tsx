import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import { HomeOutlined, ClockCircleOutlined, PlusOutlined, MessageOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import './MobileLayout.scss'

const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const title = path.replace('/', '').charAt(0).toUpperCase() + path.replace('/', '').slice(1) || 'Beviat'
  const showBack = path !== '/' && path !== '/user' && path !== '/chat' && path !== '/auction'
  const hideHeader = path === '/' || path === '/user' || path === '/chat' || path === '/auction'

  const tabs = [
    { key: '/', title: '首页', icon: <HomeOutlined /> },
    { key: '/auction', title: '拍卖', icon: <ClockCircleOutlined /> },
    { key: '/product/publish', title: '发布', icon: <PlusOutlined /> },
    { key: '/chat', title: '消息', icon: <MessageOutlined /> },
    { key: '/user', title: '我的', icon: <UserOutlined /> },
  ]

  return (
    <div className="mobile-layout">
      {!hideHeader && (
        <header className="mobile-header glass">
          <div className="header-content">
            {showBack && <ArrowLeftOutlined onClick={() => navigate(-1)} style={{ fontSize: 20 }} />}
            <h1 className="header-title">{title}</h1>
            <div className="header-right" />
          </div>
        </header>
      )}

      <main className={`mobile-main ${hideHeader ? 'no-header' : ''}`}>
        {children}
      </main>

      <TabBar
        activeKey={path}
        onChange={(key) => navigate(key)}
        className="mobile-tabbar"
      >
        {tabs.map((tab) => (
          <TabBar.Item
            key={tab.key}
            icon={tab.key === '/product/publish' ? (
              <div className="publish-btn">
                <PlusOutlined style={{ fontSize: 24, color: 'white' }} />
              </div>
            ) : tab.icon}
            title={tab.key !== '/product/publish' ? tab.title : undefined}
          />
        ))}
      </TabBar>
    </div>
  )
}

export default MobileLayout
