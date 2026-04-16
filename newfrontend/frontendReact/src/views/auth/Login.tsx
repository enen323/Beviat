import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import './Login.scss'

interface LoginFormValues {
  username: string
  password: string
  remember: boolean
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setToken, setUserInfo } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<LoginFormValues>()

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true)
    try {
      const data = await userApi.login({
        username: values.username,
        password: values.password,
      })
      setToken(data.accessToken)
      const profile = await userApi.getProfile()
      setUserInfo(profile)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container glass">
        <div className="login-header">
          <h1 className="login-title">欢迎回来</h1>
          <p className="login-subtitle">登录 Beviat，发现身边好物</p>
        </div>

        <Form
          form={form}
          className="login-form"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名或手机号' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名/手机号"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <div className="login-options">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <Link to="/auth/forgot" className="forgot-link">忘记密码？</Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="login-btn"
              block
            >
              登录
            </Button>
          </Form.Item>

          <div className="login-footer">
            <span className="footer-text">还没有账号？</span>
            <Link to="/auth/register" className="register-link">立即注册</Link>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default Login
