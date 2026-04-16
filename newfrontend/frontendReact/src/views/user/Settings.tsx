import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Select, Upload, Button, Avatar, Divider, message, Modal } from 'antd'
import {
  UserOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { UploadFile } from 'antd'
import './Settings.scss'

const genderOptions = [
  { label: '未设置', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 },
]

const UserSettings: React.FC = () => {
  const navigate = useNavigate()
  const { userInfo, setUserInfo, logout } = useUserStore()
  const [form] = Form.useForm()
  const [avatarFile, setAvatarFile] = useState<UploadFile | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>(userInfo?.avatar || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userInfo) {
      form.setFieldsValue({
        nickname: userInfo.nickname,
        bio: userInfo.bio,
        gender: userInfo.gender,
        school: userInfo.school,
        department: userInfo.department,
        major: userInfo.major,
        enrollYear: userInfo.enrollYear,
      })
      setAvatarPreview(userInfo.avatar || '')
    }
  }, [userInfo, form])

  const handleAvatarChange = (info: any) => {
    const file = info.fileList?.[info.fileList.length - 1]
    if (file?.originFileObj) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target?.result as string)
      reader.readAsDataURL(file.originFileObj)
    }
  }

  const handleSave = async (values: any) => {
    setSaving(true)
    try {
      const formData = new FormData()
      if (avatarFile?.originFileObj) {
        formData.append('avatarFile', avatarFile.originFileObj)
      }
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
      const updated = await userApi.updateProfile(formData)
      setUserInfo(updated)
      message.success('保存成功')
    } catch {
      // handled
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录',
      icon: <ExclamationCircleOutlined />,
      content: '退出后需要重新登录',
      okText: '退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        logout()
        navigate('/')
      },
    })
  }

  if (!userInfo) {
    return (
      <div className="settings-loading">
        <p>请先登录</p>
        <Button type="primary" onClick={() => navigate('/auth/login')}>去登录</Button>
      </div>
    )
  }

  return (
    <div className="user-settings">
      <div className="settings-back">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>

      <div className="settings-card glass-card">
        <h1 className="settings-title">个人设置</h1>

        {/* Avatar Upload */}
        <div className="avatar-section">
          <Avatar size={80} src={avatarPreview} icon={<UserOutlined />} className="avatar-preview">
            {userInfo.nickname?.charAt(0)}
          </Avatar>
          <Upload
            showUploadList={false}
            onChange={handleAvatarChange}
            beforeUpload={() => false}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} size="small">更换头像</Button>
          </Upload>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSave} className="settings-form">
          <Divider orientation="left">基本信息</Divider>

          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="输入昵称" maxLength={20} />
          </Form.Item>

          <Form.Item name="bio" label="个人简介">
            <Input.TextArea placeholder="介绍一下自己吧" rows={3} maxLength={200} showCount />
          </Form.Item>

          <Form.Item name="gender" label="性别">
            <Select options={genderOptions} />
          </Form.Item>

          <Form.Item name="school" label="学校">
            <Input placeholder="输入学校名称" />
          </Form.Item>

          <Form.Item name="department" label="院系">
            <Input placeholder="输入院系" />
          </Form.Item>

          <Form.Item name="major" label="专业">
            <Input placeholder="输入专业" />
          </Form.Item>

          <Form.Item name="enrollYear" label="入学年份">
            <Select placeholder="选择入学年份">
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i
                return { label: `${year}级`, value: year }
              }).map((o) => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} block className="save-btn">
              保存修改
            </Button>
          </Form.Item>
        </Form>

        <Divider orientation="left">账号信息</Divider>
        <div className="account-info">
          <div className="info-row">
            <span className="info-label">用户名</span>
            <span className="info-value">{userInfo.username}</span>
          </div>
          <div className="info-row">
            <span className="info-label">手机号</span>
            <span className="info-value">{userInfo.phone || '未绑定'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">邮箱</span>
            <span className="info-value">{userInfo.email || '未绑定'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">学号</span>
            <span className="info-value">{userInfo.studentId || '未填写'}</span>
          </div>
        </div>

        <Divider />

        <div className="danger-zone">
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            block
            className="logout-btn"
          >
            退出登录
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UserSettings
