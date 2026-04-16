import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import './NotFound.scss'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-code">404</h1>
        <p className="not-found-message">页面未找到</p>
        <p className="not-found-desc">
          抱歉，您访问的页面不存在或已被移除
        </p>
        <Button
          type="primary"
          icon={<HomeOutlined />}
          onClick={() => navigate('/')}
          className="back-home-btn"
        >
          返回首页
        </Button>
      </div>
    </div>
  )
}

export default NotFound
