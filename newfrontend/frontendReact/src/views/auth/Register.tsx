import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Checkbox, message } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { userApi } from '@/api'
import './Register.scss'

interface RegisterFormValues {
  username: string
  phone: string
  password: string
  confirmPassword: string
  agreeTerms: boolean
}

const STEPS = [
  { key: 'account', label: '账号信息', icon: '👤' },
  { key: 'security', label: '安全设置', icon: '🔐' },
  { key: 'confirm', label: '确认注册', icon: '✅' },
]

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState<Partial<RegisterFormValues>>({})
  const [form] = Form.useForm<RegisterFormValues>()
  const stepContentRef = useRef<HTMLDivElement>(null)

  const goToStep = useCallback(
    (step: number) => {
      setDirection(step > currentStep ? 1 : -1)
      setCurrentStep(step)
    },
    [currentStep]
  )

  const handleNext = async () => {
    try {
      const values = await form.validateFields()
      setFormData((prev) => ({ ...prev, ...values }))
      setDirection(1)
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    } catch {
      // validation failed
    }
  }

  const handleBack = () => {
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleRegister = async () => {
    setLoading(true)
    try {
      await userApi.register({
        username: formData.username!,
        password: formData.password!,
        phone: formData.phone!,
      })
      message.success('注册成功，请登录')
      navigate('/auth/login')
    } catch (error) {
      console.error('Register failed:', error)
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
            <span className="step-emoji">👤</span>
            <h2 className="step-title">创建你的账号</h2>
            <p className="step-desc">填写基本信息，开启你的二手交易之旅</p>
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
              placeholder="用户名（3-20个字符）"
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
              placeholder="手机号"
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
            <span className="step-emoji">🔐</span>
            <h2 className="step-title">设置安全密码</h2>
            <p className="step-desc">设置一个安全的密码来保护你的账号</p>
          </div>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码（至少6位）"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              size="large"
            />
          </Form.Item>
        </div>
      )
    }

    if (currentStep === 2) {
      return (
        <div className={`step-content ${animClass}`} key="step-2">
          <div className="step-header">
            <span className="step-emoji">✅</span>
            <h2 className="step-title">确认并注册</h2>
            <p className="step-desc">确认你的信息无误后，点击完成注册</p>
          </div>
          <div className="confirm-summary">
            <div className="summary-item">
              <span className="summary-label">用户名</span>
              <span className="summary-value">{formData.username}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">手机号</span>
              <span className="summary-value">
                {formData.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">密码</span>
              <span className="summary-value">{'•'.repeat(formData.password?.length || 0)}</span>
            </div>
          </div>
          <Form.Item
            name="agreeTerms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('请同意用户协议和隐私政策')),
              },
            ]}
          >
            <Checkbox>
              我已阅读并同意
              <Link to="/terms" className="terms-link">
                《用户协议》
              </Link>
              和
              <Link to="/privacy" className="terms-link">
                《隐私政策》
              </Link>
            </Checkbox>
          </Form.Item>
        </div>
      )
    }

    return null
  }

  const isLastStep = currentStep === STEPS.length - 1
  const isFirstStep = currentStep === 0

  return (
    <div className="register-page">
      <div className="register-container glass">
        <div className="register-header">
          <h1 className="register-title">加入 Beviat</h1>
          <p className="register-subtitle">注册账号，开启你的二手交易之旅</p>
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
              onClick={() => index < currentStep && goToStep(index)}
            >
              <div className="step-circle">
                {index < currentStep ? (
                  <CheckOutlined className="step-check" />
                ) : (
                  <span className="step-number">{index + 1}</span>
                )}
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
          className="register-form"
          onFinish={() => isLastStep && handleRegister()}
          autoComplete="off"
          initialValues={formData}
        >
          <div className="step-content-wrapper" ref={stepContentRef}>
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="step-actions">
            {!isFirstStep && (
              <Button
                type="default"
                onClick={handleBack}
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
                onClick={handleNext}
                icon={<ArrowRightOutlined />}
                className="step-next-btn"
                size="large"
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<CheckOutlined />}
                className="step-submit-btn"
                size="large"
              >
                完成注册
              </Button>
            )}
          </div>
        </Form>

        <div className="register-footer">
          <span className="footer-text">已有账号？</span>
          <Link to="/auth/login" className="login-link">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
