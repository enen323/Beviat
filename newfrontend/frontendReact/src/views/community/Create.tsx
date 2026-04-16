import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Radio, Upload, Button, message } from 'antd'
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { communityApi } from '@/api'
import type { UploadFile } from 'antd'
import './Create.scss'

const categoryOptions = [
  { label: '生活', value: '生活' },
  { label: '学习', value: '学习' },
  { label: '二手', value: '二手' },
  { label: '活动', value: '活动' },
  { label: '求助', value: '求助' },
  { label: '分享', value: '分享' },
]

const CreatePost: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values: { title: string; content: string; category: string }) => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('content', values.content)
      formData.append('category', values.category)
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj)
        }
      })
      const newPost = await communityApi.createPost(formData)
      message.success('发布成功')
      navigate(`/community/post/${newPost.id}`)
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-post-page">
      <div className="create-post-back">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/community')}>
          返回社区
        </Button>
      </div>

      <div className="create-post-card glass-card">
        <h1 className="create-post-title">发布帖子</h1>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ category: '生活' }}
          className="create-post-form"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入帖子标题' }]}
          >
            <Input placeholder="输入帖子标题" maxLength={100} showCount size="large" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入帖子内容' }]}
          >
            <Input.TextArea
              placeholder="分享你的想法..."
              rows={6}
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Form.Item name="category" label="分类">
            <Radio.Group optionType="button" buttonStyle="solid" options={categoryOptions} />
          </Form.Item>

          <Form.Item label="图片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
              multiple
              maxCount={9}
            >
              {fileList.length < 9 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item>
            <div className="form-actions">
              <Button onClick={() => navigate('/community')}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                发布
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default CreatePost
