import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, message } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  KeyOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { userApi } from '@/api'
import './ForgotPassword.scss'

interface ForgotFormValues {
  username: string
  phone: string
  verifyCode: string
  newPassword: string
  confirmPassword: string
}

const STEPS = [
  { key: 'verify', label: '验证身份', icon: '🔐' },
  { key: 'reset', label: '重置密码', icon: '🔑' },
]

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [resetToken, setResetToken] = useState('')
  const [form] = Form.useForm<ForgotFormValues>()
  const stepContentRef = useRef<HTMLDivElement>(null)

  const goToStep = useCallback(
    (step: number) => {
      setDirection(step > currentStep ? 1 : -1)
      setCurrentStep(step)
    },
    [currentStep]
  )

  const handleVerify = async () => {
    try {
      const values = await form.validateFields(['username', 'phone', 'verifyCode'])
      setLoading(true)
      const token = await userApi.forgotPassword({
        username: values.username,
        phone: values.phone,
        verifyCode: values.verifyCode,
      })
      setResetToken(token)
      message.success('身份验证通过')
      setDirection(1)
      setCurrentStep(1)
    } catch (error: any) {
      if (error?.message) {
        message.error(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      const values = await form.validateFields(['newPassword', 'confirmPassword'])
      setLoading(true)
      await userApi.resetPassword({
        resetToken,
        newPassword: values.newPassword,
      })
      message.success('密码重置成功，请重新登录')
      navigate('/auth/login')
    } catch (error: any) {
      if (error?.message) {
        message.error(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    const animClass = direction >= 0 ? 'slide-enter' : 'slide-enter-reverse'

    if (currentStep === 0) {
      return (
        <div className={`step-content ${animClass}`} key="step-0">
          <div className="step-header">
            <span className="step-emoji">🔐</span>
            <h2 className="step-title">验证你的身份</h2>
            <p className="step-desc">请输入注册时使用的用户名和手机号</p>
          </div>
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度为3-20个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              allowClear
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="注册时绑定的手机号"
              allowClear
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="verifyCode"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Input
              prefix={<SafetyCertificateOutlined />}
              placeholder="验证码（默认123456）"
              allowClear
              size="large"
            />
          </Form.Item>
        </div>
      )
    }

    if (currentStep === 1) {
      return (
        <div className={`step-content ${animClass}`} key="step-1">
          <div className="step-header">
            <span className="step-emoji">🔑</span>
            <h2 className="step-title">设置新密码</h2>
            <p className="step-desc">请输入你的新密码</p>
          </div>
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="新密码（至少6位）"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="确认新密码"
              size="large"
            />
          </Form.Item>
        </div>
      )
    }

    return null
  }

  const isLastStep = currentStep === STEPS.length - 1
  const isFirstStep = currentStep === 0

  return (
    <div className="forgot-page">
      <div className="forgot-container glass">
        <div className="forgot-header">
          <h1 className="forgot-title">忘记密码</h1>
          <p className="forgot-subtitle">验证身份后即可重置密码</p>
        </div>

        {/* Stepper Indicator */}
        <div className="stepper-indicator">
          {STEPS.map((step, index) => (
            <div
              key={step.key}
              className={`stepper-step ${
                index === currentStep
                  ? 'active'
                  : index < currentStep
                  ? 'completed'
                  : 'upcoming'
              }`}
            >
              <div className="step-circle">
                <span className="step-number">{index + 1}</span>
              </div>
              <span className="step-label">{step.label}</span>
              {index < STEPS.length - 1 && (
                <div
                  className={`step-line ${
                    index < currentStep ? 'completed' : ''
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Form
          form={form}
          className="forgot-form"
          autoComplete="off"
        >
          <div className="step-content-wrapper" ref={stepContentRef}>
            {renderStepContent()}
          </div>

          <div className="step-actions">
            {isFirstStep ? (
              <Button
                type="default"
                onClick={() => navigate('/auth/login')}
                icon={<ArrowLeftOutlined />}
                className="step-back-btn"
                size="large"
              >
                返回登录
              </Button>
            ) : (
              <Button
                type="default"
                onClick={() => goToStep(0)}
                icon={<ArrowLeftOutlined />}
                className="step-back-btn"
                size="large"
              >
                上一步
              </Button>
            )}
            {!isLastStep ? (
              <Button
                type="primary"
                onClick={handleVerify}
                loading={loading}
                className="step-next-btn"
                size="large"
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleReset}
                loading={loading}
                className="step-submit-btn"
                size="large"
              >
                重置密码
              </Button>
            )}
          </div>
        </Form>

        <div className="forgot-footer">
          <span className="footer-text">想起密码了？</span>
          <Link to="/auth/login" className="login-link">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
