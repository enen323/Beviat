import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Form, InputNumber, DatePicker, Button, Select, Card, message, Spin, Empty, Image } from 'antd'
import { DollarOutlined, ClockCircleOutlined, ArrowLeftOutlined, RiseOutlined } from '@ant-design/icons'
import { auctionApi, userApi } from '@/api'
import type { Product } from '@/api'
import dayjs from 'dayjs'
import './Create.scss'

const CreateAuction: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedProductId = searchParams.get('productId')
  const [form] = Form.useForm()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const list = await userApi.getMyProducts('available')
        setProducts(list)
        if (preselectedProductId) {
          const pid = Number(preselectedProductId)
          form.setFieldValue('productId', pid)
          setSelectedProductId(pid)
        }
      } catch {
        message.error('加载商品列表失败')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [preselectedProductId, form])

  const [selectedProductId, setSelectedProductId] = useState<number | undefined>()

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId)
  }, [selectedProductId, products])

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      await auctionApi.create({
        productId: values.productId,
        startingPrice: values.startingPrice,
        priceIncrement: values.priceIncrement || 1,
        endTime: values.endTime.format('YYYY-MM-DDTHH:mm:ss'),
        reservePrice: values.reservePrice,
      })
      message.success('拍卖创建成功！')
      navigate('/auction')
    } catch (e) {
      console.error('创建拍卖失败:', e)
      message.error('创建失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auction-create-page">
      <div className="create-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <h1>发起拍卖</h1>
      </div>

      <Card className="create-card glass-card">
        {loading ? (
          <div className="create-loading"><Spin size="large" /></div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              priceIncrement: 1,
              endTime: dayjs().add(7, 'day'),
            }}
            requiredMark="optional"
          >
            <Form.Item
              name="productId"
              label="选择商品"
              rules={[{ required: true, message: '请选择要拍卖的商品' }]}
            >
              <Select
                showSearch
                placeholder="选择你的在售商品"
                optionFilterProp="label"
                notFoundContent={<Empty description="暂无在售商品，先去发布商品吧" />}
                onChange={(val) => setSelectedProductId(val)}
                options={products.map(p => ({
                  value: p.id,
                  label: p.title,
                  price: p.price,
                }))}
                optionRender={(option) => (
                  <div className="product-option">
                    <Image
                      src={products.find(p => p.id === option.value)?.coverImage || products.find(p => p.id === option.value)?.images?.[0]}
                      alt={option.label as string}
                      width={40}
                      height={40}
                      style={{ objectFit: 'cover', borderRadius: 4, marginRight: 12 }}
                      preview={false}
                    />
                    <div className="product-option-info">
                      <div className="product-option-title">{option.label}</div>
                      <div className="product-option-price">参考价 ¥{(option as any).price}</div>
                    </div>
                  </div>
                )}
              />
            </Form.Item>

            {selectedProduct && (
              <div className="selected-product-preview">
                <Image
                  src={selectedProduct.coverImage || selectedProduct.images?.[0]}
                  alt={selectedProduct.title}
                  width={60}
                  height={60}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                  preview={false}
                />
                <div className="preview-info">
                  <div className="preview-title">{selectedProduct.title}</div>
                  <div className="preview-price">原价 ¥{selectedProduct.price}</div>
                </div>
              </div>
            )}

            <div className="form-row">
              <Form.Item
                name="startingPrice"
                label="起拍价"
                rules={[{ required: true, message: '请输入起拍价' }]}
                className="form-half"
              >
                <InputNumber
                  min={0.01}
                  precision={2}
                  prefix="¥"
                  placeholder="起拍价格"
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="priceIncrement"
                label="最低加价幅度"
                className="form-half"
              >
                <InputNumber
                  min={0.01}
                  precision={2}
                  prefix="¥"
                  placeholder="每次最少加价"
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </div>

            <div className="form-row">
              <Form.Item
                name="endTime"
                label="拍卖截止时间"
                rules={[{ required: true, message: '请选择截止时间' }]}
                className="form-half"
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  size="large"
                  disabledDate={(d) => d && d.isBefore(dayjs(), 'day')}
                />
              </Form.Item>

              <Form.Item
                name="reservePrice"
                label="保留价（可选）"
                className="form-half"
              >
                <InputNumber
                  min={0.01}
                  precision={2}
                  prefix="¥"
                  placeholder="低于此价不成交"
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </div>

            <div className="form-tips">
              <RiseOutlined /> 起拍价不能高于商品原价，保留价不低于起拍价
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                block
                icon={<ClockCircleOutlined />}
                className="submit-btn"
              >
                发起拍卖
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  )
}

export default CreateAuction
