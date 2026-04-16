import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Select,
  Radio,
  InputNumber,
  Upload,
  Button,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { productApi } from '@/api'
import './Publish.scss'

const categories = [
  { id: 1, name: '书籍资料' },
  { id: 2, name: '电子产品' },
  { id: 3, name: '生活用品' },
  { id: 4, name: '运动健身' },
  { id: 5, name: '服装饰品' },
  { id: 6, name: '美妆护肤' },
  { id: 7, name: '食品零食' },
  { id: 8, name: '其他' },
]

interface PublishFormValues {
  title: string
  description: string
  categoryId: number
  conditionLevel: number
  tradeType: number
  price: number
  originalPrice?: number
  location: string
}

export default function ProductPublish() {
  const navigate = useNavigate()
  const [form] = Form.useForm<PublishFormValues>()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const handleSubmit = async (values: PublishFormValues) => {
    setLoading(true)
    try {
      const data = {
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        conditionLevel: values.conditionLevel,
        tradeType: values.tradeType,
        price: values.price,
        originalPrice: values.originalPrice || undefined,
        location: values.location,
      }

      const formData = new FormData()
      formData.append(
        'data',
        new Blob([JSON.stringify(data)], { type: 'application/json' })
      )

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj)
        }
      })

      const product = await productApi.create(formData)
      message.success('发布成功')
      navigate(`/product/${product.id}`)
    } catch (error) {
      console.error('Failed to publish:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="publish-page">
      <div className="publish-inner">
        <div className="publish-header">
          <h1 className="publish-title">发布商品</h1>
          <p className="publish-subtitle">填写商品信息，让好物被更多人看到</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ conditionLevel: 99, tradeType: 2 }}
          className="publish-form"
        >
          <div className="form-section">
            <h3 className="section-label">基本信息</h3>

            <Form.Item
              label="商品标题"
              name="title"
              rules={[{ required: true, message: '请输入商品标题' }]}
            >
              <Input
                placeholder="请输入商品标题"
                maxLength={50}
                showCount
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="商品描述"
              name="description"
              rules={[{ required: true, message: '请输入商品描述' }]}
            >
              <Input.TextArea
                placeholder="详细描述商品的使用情况、购买时间等"
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="商品分类"
              name="categoryId"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="选择分类" size="large">
                {categories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="商品成色"
              name="conditionLevel"
              rules={[{ required: true, message: '请选择成色' }]}
            >
              <Radio.Group size="large">
                <Radio.Button value={1}>全新</Radio.Button>
                <Radio.Button value={99}>几乎全新</Radio.Button>
                <Radio.Button value={95}>轻微使用</Radio.Button>
                <Radio.Button value={90}>明显使用</Radio.Button>
                <Radio.Button value={80}>有瑕疵</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="交易方式"
              name="tradeType"
              rules={[{ required: true, message: '请选择交易方式' }]}
            >
              <Radio.Group size="large">
                <Radio.Button value={0}>仅自提</Radio.Button>
                <Radio.Button value={1}>仅快递</Radio.Button>
                <Radio.Button value={2}>都可以</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </div>

          <div className="form-section">
            <h3 className="section-label">价格</h3>

            <div className="price-row">
              <Form.Item
                label="售价"
                name="price"
                className="price-field"
                rules={[{ required: true, message: '请输入售价' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  step={1}
                  size="large"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="原价"
                name="originalPrice"
                className="price-field"
              >
                <InputNumber
                  min={0}
                  precision={2}
                  step={1}
                  size="large"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-label">商品图片</h3>

            <Upload
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
              maxCount={9}
              listType="picture-card"
              accept="image/*"
            >
              {fileList.length < 9 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
            <p className="upload-tip">最多上传9张图片，第一张为封面图</p>
          </div>

          <div className="form-section">
            <h3 className="section-label">交易地点</h3>

            <Form.Item
              label="交易地点"
              name="location"
              rules={[{ required: true, message: '请输入交易地点' }]}
            >
              <Input placeholder="如：北京大学校内" size="large" />
            </Form.Item>
          </div>

          <Form.Item>
            <div className="submit-actions">
              <Button size="large" onClick={() => navigate(-1)}>
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
              >
                发布商品
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
