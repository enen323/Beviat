import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Radio, Avatar, Button } from 'antd'
import { StarOutlined, LoadingOutlined } from '@ant-design/icons'
import { BookOpen, Smartphone, Home, Dumbbell, Shirt, Sparkles, Cake, Package } from 'lucide-react'
import { productApi, auctionApi, type Product, type Auction } from '@/api'
import StaggeredMenu from '@/components/StaggeredMenu'
import SplitText from '@/components/SplitText'
import InfiniteMenu from '@/components/InfiniteMenu'
import './index.scss'

const categories = [
  { id: 1, name: '书籍资料', icon: <BookOpen />, color: '#3B82F6' },
  { id: 2, name: '电子产品', icon: <Smartphone />, color: '#8B5CF6' },
  { id: 3, name: '生活用品', icon: <Home />, color: '#F59E0B' },
  { id: 4, name: '运动健身', icon: <Dumbbell />, color: '#10B981' },
  { id: 5, name: '服装饰品', icon: <Shirt />, color: '#EC4899' },
  { id: 6, name: '美妆护肤', icon: <Sparkles />, color: '#F43F5E' },
  { id: 7, name: '食品零食', icon: <Cake />, color: '#F97316' },
  { id: 8, name: '更多分类', icon: <Package />, color: '#6B7280' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(() => {
    const cat = searchParams.get('category')
    return cat ? Number(cat) : undefined
  })
  const [keyword, setKeyword] = useState<string | undefined>(() => {
    const kw = searchParams.get('keyword')
    return kw || undefined
  })
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sortBy, setSortBy] = useState<string>('time')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hotAuctions, setHotAuctions] = useState<Auction[]>([])

  const heroSectionRef = useRef<HTMLElement>(null)
  const productsSectionRef = useRef<HTMLElement>(null)
  const parallaxOffsetX = useRef(0)
  const parallaxOffsetY = useRef(0)
  const parallaxRaf = useRef<number | null>(null)
  const [parallaxStyle, setParallaxStyle] = useState<React.CSSProperties>({
    transform: 'translate(0px, 0px)',
    transition: 'transform 0.15s ease-out',
  })

  // Sync category & keyword from URL search params
  useEffect(() => {
    const cat = searchParams.get('category')
    setSelectedCategoryId(cat ? Number(cat) : undefined)
    const kw = searchParams.get('keyword')
    setKeyword(kw || undefined)
  }, [searchParams])

  // Load recommendations & hot auctions on mount
  useEffect(() => {
    loadRecommendations()
    loadHotAuctions()
  }, [])

  // Reload products when category, keyword, or sortBy changes
  useEffect(() => {
    setCurrentPage(1)
    loadProducts(1)
  }, [selectedCategoryId, keyword, sortBy])

  // ---- Parallax ----
  const handleHeroMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroSectionRef.current) return
    const rect = heroSectionRef.current.getBoundingClientRect()
    const centerX = (e.clientX - rect.left) / rect.width - 0.5
    const centerY = (e.clientY - rect.top) / rect.height - 0.5
    parallaxOffsetX.current = centerX * 40
    parallaxOffsetY.current = centerY * 15

    if (parallaxRaf.current) cancelAnimationFrame(parallaxRaf.current)
    parallaxRaf.current = requestAnimationFrame(() => {
      setParallaxStyle({
        transform: `translate(${parallaxOffsetX.current}px, ${parallaxOffsetY.current}px)`,
        transition: 'transform 0.15s ease-out',
      })
    })
  }, [])

  const handleHeroMouseLeave = useCallback(() => {
    parallaxOffsetX.current = 0
    parallaxOffsetY.current = 0
    setParallaxStyle({
      transform: 'translate(0px, 0px)',
      transition: 'transform 0.15s ease-out',
    })
  }, [])

  useEffect(() => {
    return () => {
      if (parallaxRaf.current) cancelAnimationFrame(parallaxRaf.current)
    }
  }, [])

  // ---- Data loading ----
  async function loadRecommendations() {
    try {
      const data = await productApi.getRecommendations(10)
      setRecommendations(data)
    } catch {
      setRecommendations([])
    }
  }

  async function loadHotAuctions() {
    try {
      const res = await auctionApi.list({ status: 0, page: 1, size: 4 })
      setHotAuctions(res.records || [])
    } catch {
      setHotAuctions([])
    }
  }

  async function loadProducts(page?: number) {
    if (loading) return
    const targetPage = page ?? currentPage
    setLoading(true)
    try {
      const data = await productApi.list({
        sortBy: sortBy as any,
        categoryId: selectedCategoryId,
        keyword: keyword,
        page: targetPage,
        size: 20,
      })
      if (targetPage === 1) {
        setProducts(data.records)
      } else {
        setProducts(prev => [...prev, ...data.records])
      }
      setHasMore(targetPage < data.pages)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleCategoryClick(categoryId: number) {
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(undefined)
      setSearchParams({})
    } else {
      setSelectedCategoryId(categoryId)
      setSearchParams({ category: String(categoryId) })
    }
    setCurrentPage(1)
    // Scroll to products section
    setTimeout(() => {
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  async function handleFavorite(productId: number) {
    try {
      await productApi.favorite(productId)
    } catch (error) {
      console.error('Failed to favorite:', error)
    }
  }

  function scrollToProducts() {
    productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSortChange = (e: any) => {
    setSortBy(e.target.value)
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section
        className="hero-section section-dark"
        ref={heroSectionRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        <div className="hero-bg-parallax" style={parallaxStyle}>
          <div className="hero-bg-scene hero-bg-scene-far" />
          <div className="hero-bg-scene hero-bg-scene-mid" />
          <div className="hero-bg-scene hero-bg-scene-near" />
        </div>
        <div className="hero-bg-overlay" />
        <div className="hero-content">
          <SplitText
            text="发现身边好物"
            className="hero-title"
            tag="h1"
            delay={80}
            duration={1}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-50px"
            textAlign="center"
          />
          <SplitText
            text="让闲置流动起来，遇见更好的生活"
            className="hero-subtitle"
            tag="p"
            delay={30}
            duration={0.8}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-50px"
            textAlign="center"
          />
          <div className="hero-actions">
            <a className="cta-pill cta-filled" onClick={() => navigate('/product/publish')}>
              发布商品
            </a>
            <a className="cta-pill cta-outline" onClick={scrollToProducts}>
              浏览好物 ›
            </a>
          </div>
        </div>
      </section>

      {/* Hot Auctions Section */}
      {hotAuctions.length > 0 && (
        <section className="auction-section section-dark">
          <div className="section-inner">
            <div className="section-header">
              <h2 className="section-title">🔥 热门拍卖</h2>
              <a className="section-more" onClick={() => navigate('/auction')}>
                查看全部 →
              </a>
            </div>
            <div className="auction-home-grid">
              {hotAuctions.map((auction) => (
                <div
                  key={auction.id}
                  className="auction-home-card glass-card"
                  onClick={() => navigate(`/auction/${auction.id}`)}
                >
                  <div className="auction-home-image">
                    <img
                      src={auction.product?.coverImage || auction.product?.images?.[0] || ''}
                      alt={auction.product?.title}
                    />
                    <span className="auction-home-badge">拍卖中</span>
                  </div>
                  <div className="auction-home-body">
                    <h3 className="auction-home-title">{auction.product?.title}</h3>
                    <div className="auction-home-price">
                      <span className="current">¥{auction.currentPrice}</span>
                      <span className="start">起拍 ¥{auction.startPrice}</span>
                    </div>
                    <div className="auction-home-meta">
                      <span>{auction.bidCount} 次出价</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Products Section */}
      <section ref={productsSectionRef} className="products-section section-light">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">最新发布</h2>
            <div className="section-header-right">
              <div className="filter-tabs">
                <Radio.Group value={sortBy} onChange={handleSortChange} size="small">
                  <Radio.Button value="time">最新</Radio.Button>
                  <Radio.Button value="price">价格</Radio.Button>
                  <Radio.Button value="distance">距离</Radio.Button>
                </Radio.Group>
              </div>
              <StaggeredMenu
                items={categories.map(cat => ({
                  icon: cat.icon,
                  label: cat.name,
                  ariaLabel: `浏览${cat.name}分类`,
                  link: `/?category=${cat.id}`,
                  onClick: () => handleCategoryClick(cat.id),
                  color: cat.color,
                }))}
                menuButtonColor="#333333"
                accentColor="#5227FF"
                closeOnClickAway={true}
              />
            </div>
          </div>

          <div className="products-waterfall">
            {products.map(product => (
              <div
                key={product.id}
                className="waterfall-card glass-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="card-image">
                  <img src={product.coverImage} alt={product.title} />
                </div>
                <div className="card-content">
                  <h3 className="card-title">{product.title}</h3>
                  <div className="card-meta">
                    <span className="card-price">¥{product.price}</span>
                    <span className="card-location">{product.location}</span>
                  </div>
                  <div className="card-footer">
                    <div className="seller-info">
                      <Avatar size={24} src={product.sellerAvatar} />
                      <span className="seller-name">{product.sellerName}</span>
                    </div>
                    <Button
                      type="text"
                      icon={<StarOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFavorite(product.id)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="loading-more">
              <LoadingOutlined spin />
              <span>加载中...</span>
            </div>
          )}

          {!hasMore && products.length > 0 && (
            <div className="no-more">没有更多了</div>
          )}
        </div>
      </section>

      {/* Transition zone from "最新发布" to "猜你喜欢" */}
      <div className="section-transition">
        <div className="transition-gradient" />
        <div className="transition-content">
          <h2 className="transition-title">猜你喜欢</h2>
          <p className="transition-subtitle">滑动探索更多好物</p>
        </div>
      </div>

      {/* Recommendations Section - InfiniteMenu 3D Globe - Full page */}
      <section className="recommendations-section recommendations-fullpage">
        {recommendations.length > 0 ? (
          <InfiniteMenu
            items={recommendations.map(product => ({
              image: product.coverImage || 'https://picsum.photos/300/300?grayscale',
              link: `/product/${product.id}`,
              title: product.title,
              description: `¥${product.price}${product.originalPrice ? ` 原价¥${product.originalPrice}` : ''}`,
            }))}
            scale={0.8}
            onNavigate={(link) => navigate(link)}
          />
        ) : (
          <div className="loading-more" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingOutlined spin />
            <span>加载推荐中...</span>
          </div>
        )}
      </section>
    </div>
  )
}
