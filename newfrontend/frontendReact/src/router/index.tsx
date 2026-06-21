import { createBrowserRouter } from 'react-router-dom'
import React, { Suspense } from 'react'
import { Spin } from 'antd'

const LazyLoad = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}><Spin size="large" /></div>}>
    <Component />
  </Suspense>
)

// Layout
const ResponsiveLayout = React.lazy(() => import('@/layouts/ResponsiveLayout'))

// Pages
const Home = React.lazy(() => import('@/views/home/index'))
const Login = React.lazy(() => import('@/views/auth/Login'))
const Register = React.lazy(() => import('@/views/auth/Register'))
const ForgotPassword = React.lazy(() => import('@/views/auth/ForgotPassword'))
const ProductDetail = React.lazy(() => import('@/views/product/Detail'))
const PublishProduct = React.lazy(() => import('@/views/product/Publish'))
const ChatList = React.lazy(() => import('@/views/chat/index'))
const ChatDetail = React.lazy(() => import('@/views/chat/Detail'))
const AuctionList = React.lazy(() => import('@/views/auction/index'))
const AuctionDetail = React.lazy(() => import('@/views/auction/Detail'))
const CommunityList = React.lazy(() => import('@/views/community/index'))
const CommunityDetail = React.lazy(() => import('@/views/community/Detail'))
const CreatePost = React.lazy(() => import('@/views/community/Create'))
const AuctionCreate = React.lazy(() => import('@/views/auction/Create'))
const OrderList = React.lazy(() => import('@/views/order/OrderList'))
const OrderDetail = React.lazy(() => import('@/views/order/OrderDetail'))
const UserProfile = React.lazy(() => import('@/views/user/Profile'))
const UserSettings = React.lazy(() => import('@/views/user/Settings'))
const Admin = React.lazy(() => import('@/views/admin/index'))
const NotFound = React.lazy(() => import('@/views/error/NotFound'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ResponsiveLayout>{LazyLoad(Home)}</ResponsiveLayout>,
    handle: { title: '首页 - Beviat' },
  },
  {
    path: '/auth/login',
    element: <ResponsiveLayout>{LazyLoad(Login)}</ResponsiveLayout>,
    handle: { title: '登录 - Beviat' },
  },
  {
    path: '/auth/register',
    element: <ResponsiveLayout>{LazyLoad(Register)}</ResponsiveLayout>,
    handle: { title: '注册 - Beviat' },
  },
  {
    path: '/auth/forgot',
    element: <ResponsiveLayout>{LazyLoad(ForgotPassword)}</ResponsiveLayout>,
    handle: { title: '忘记密码 - Beviat' },
  },
  {
    path: '/product/:id',
    element: <ResponsiveLayout>{LazyLoad(ProductDetail)}</ResponsiveLayout>,
    handle: { title: '商品详情 - Beviat' },
  },
  {
    path: '/product/publish',
    element: <ResponsiveLayout>{LazyLoad(PublishProduct)}</ResponsiveLayout>,
    handle: { title: '发布商品 - Beviat' },
  },
  {
    path: '/chat',
    element: <ResponsiveLayout>{LazyLoad(ChatList)}</ResponsiveLayout>,
    handle: { title: '消息 - Beviat' },
  },
  {
    path: '/chat/:id',
    element: <ResponsiveLayout>{LazyLoad(ChatDetail)}</ResponsiveLayout>,
    handle: { title: '聊天 - Beviat' },
  },
  {
    path: '/auction',
    element: <ResponsiveLayout>{LazyLoad(AuctionList)}</ResponsiveLayout>,
    handle: { title: '拍卖 - Beviat' },
  },
  {
    path: '/auction/create',
    element: <ResponsiveLayout>{LazyLoad(AuctionCreate)}</ResponsiveLayout>,
    handle: { title: '发起拍卖 - Beviat' },
  },
  {
    path: '/auction/:id',
    element: <ResponsiveLayout>{LazyLoad(AuctionDetail)}</ResponsiveLayout>,
    handle: { title: '拍卖详情 - Beviat' },
  },
  {
    path: '/community',
    element: <ResponsiveLayout>{LazyLoad(CommunityList)}</ResponsiveLayout>,
    handle: { title: '社区 - Beviat' },
  },
  {
    path: '/community/create',
    element: <ResponsiveLayout>{LazyLoad(CreatePost)}</ResponsiveLayout>,
    handle: { title: '发布帖子 - Beviat' },
  },
  {
    path: '/community/post/:id',
    element: <ResponsiveLayout>{LazyLoad(CommunityDetail)}</ResponsiveLayout>,
    handle: { title: '帖子详情 - Beviat' },
  },
  {
    path: '/orders',
    element: <ResponsiveLayout>{LazyLoad(OrderList)}</ResponsiveLayout>,
    handle: { title: '我的订单 - Beviat' },
  },
  {
    path: '/order/:id',
    element: <ResponsiveLayout>{LazyLoad(OrderDetail)}</ResponsiveLayout>,
    handle: { title: '订单详情 - Beviat' },
  },
  {
    path: '/user/:id?',
    element: <ResponsiveLayout>{LazyLoad(UserProfile)}</ResponsiveLayout>,
    handle: { title: '个人中心 - Beviat' },
  },
  {
    path: '/user/settings',
    element: <ResponsiveLayout>{LazyLoad(UserSettings)}</ResponsiveLayout>,
    handle: { title: '设置 - Beviat' },
  },
  {
    path: '/admin',
    element: <ResponsiveLayout>{LazyLoad(Admin)}</ResponsiveLayout>,
    handle: { title: '管理后台 - Beviat' },
  },
  {
    path: '/404',
    element: <ResponsiveLayout>{LazyLoad(NotFound)}</ResponsiveLayout>,
    handle: { title: '页面未找到 - Beviat' },
  },
  {
    path: '*',
    element: <ResponsiveLayout>{LazyLoad(NotFound)}</ResponsiveLayout>,
  },
])
