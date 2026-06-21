import { get, post, put, del } from '@/utils/request'
import type { PageResponse } from '@/utils/request'

export interface Product {
  id: number
  title: string
  description: string
  price: number
  originalPrice?: number
  conditionLevel: number
  conditionLevelText?: string
  tradeType: number
  categoryId: number
  categoryName: string
  images: string[]
  coverImage: string
  location: string
  latitude?: number
  longitude?: number
  sellerId: number
  sellerName: string
  sellerAvatar: string
  sellerCreditScore: number
  sellerSchool?: string
  viewCount: number
  favoriteCount: number
  status: number | 'available' | 'sold' | 'reserved'
  isTop?: boolean
  favorited?: boolean
  createdAt: string
  updatedAt: string
}

/** 将后端 ProductVO 字段映射为前端 Product 接口 */
function normalizeProduct(raw: any): Product {
  return {
    id: raw.id,
    title: raw.title || '',
    description: raw.description || '',
    price: raw.price ?? 0,
    originalPrice: raw.originalPrice,
    conditionLevel: raw.conditionLevel,
    conditionLevelText: raw.conditionLevelText,
    tradeType: raw.tradeType,
    categoryId: raw.categoryId,
    categoryName: raw.categoryName || '',
    images: raw.images || [],
    coverImage: raw.coverImage || '',
    location: raw.location || '',
    latitude: raw.latitude,
    longitude: raw.longitude,
    sellerId: raw.sellerId ?? 0,
    sellerName: raw.sellerName || raw.sellerNickname || '',
    sellerAvatar: raw.sellerAvatar || '',
    sellerCreditScore: raw.sellerCreditScore ?? 0,
    sellerSchool: raw.sellerSchool,
    viewCount: raw.viewCount ?? 0,
    favoriteCount: raw.favoriteCount ?? 0,
    status: raw.status,
    isTop: raw.isTop,
    favorited: raw.favorited,
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
  }
}

export interface ProductQuery {
  keyword?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  condition?: string
  location?: string
  sortBy?: 'time' | 'price' | 'distance'
  sortOrder?: 'asc' | 'desc'
  page?: number
  size?: number
}

export const productApi = {
  list: (params: ProductQuery) => get<PageResponse<Product>>('/products', { params })
    .then(res => ({ ...res, records: (res.records || []).map(normalizeProduct) })),
  detail: (id: number) => get<any>(`/products/${id}`).then(normalizeProduct),
  create: (data: FormData) => post<any>('/products', data).then(normalizeProduct),
  update: (id: number, data: FormData) => put<any>(`/products/${id}`, data).then(normalizeProduct),
  delete: (id: number) => del(`/products/${id}`),
  favorite: (id: number) => post(`/products/${id}/favorite`),
  unfavorite: (id: number) => del(`/products/${id}/favorite`),
  getRecommendations: (limit?: number) => get<any[]>('/products/recommendations', { params: { limit } })
    .then(list => (list || []).map(normalizeProduct)),
  getNearby: (latitude: number, longitude: number, distance?: number) =>
    get<any[]>('/products/nearby', { params: { latitude, longitude, distance } })
      .then(list => (list || []).map(normalizeProduct)),
}

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  email: string
  studentId?: string
  gender?: number
  school?: string
  department?: string
  major?: string
  enrollYear?: number
  bio?: string
  creditScore: number
  createdAt: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  phone: string
  nickname?: string
  email?: string
  studentId?: string
  school?: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
}

export interface RegisterResult {}

export interface ForgotPasswordParams {
  username: string
  phone: string
  verifyCode: string
}

export interface ResetPasswordParams {
  resetToken: string
  newPassword: string
}

export const userApi = {
  login: (data: LoginParams) => post<LoginResult>('/auth/login', data),
  register: (data: RegisterParams) => post<RegisterResult>('/auth/register', data),
  forgotPassword: (data: ForgotPasswordParams) => post<string>('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordParams) => post<void>('/auth/reset-password', data),
  getProfile: () => get<User>('/auth/me'),
  refreshToken: (refreshToken: string) => post<LoginResult>('/auth/refresh', null, { params: { refreshToken } }),
  logout: () => post('/auth/logout'),
  updateProfile: (data: FormData) => put<User>('/users/me/profile', data),
  follow: (id: number) => post(`/users/${id}/follow`),
  unfollow: (id: number) => del(`/users/${id}/follow`),
  getMyProducts: (status?: string) => get<any[]>('/products/me/products', { params: { status } })
    .then(list => (list || []).map(normalizeProduct)),
  getFavorites: () => get<any[]>('/products/me/favorites')
    .then(list => (list || []).map(normalizeProduct)),
}

export interface Message {
  id: number
  content: string
  type: 'text' | 'image' | 'product'
  messageType?: number
  senderId: number
  receiverId: number
  productId?: number
  productSnapshot?: Product
  createdAt: string
  isRead: boolean
}

function normalizeMessage(msg: any): Message {
  const type: 'text' | 'image' | 'product' = msg.type || (msg.messageType === 2 ? 'image' : msg.messageType === 3 ? 'product' : 'text')
  const result: Message = { ...msg, type }
  if (type === 'product' && !msg.productSnapshot && (msg.productTitle || msg.productImage)) {
    result.productSnapshot = {
      title: msg.productTitle || '',
      coverImage: msg.productImage || '',
      price: 0,
    } as any
  }
  return result
}

export interface Conversation {
  id: number
  peerId: number
  peerName: string
  peerAvatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  productId?: number
  productSnapshot?: Product
}

export const chatApi = {
  getConversations: () => get<Conversation[]>('/chats'),
  getMessages: (targetUserId: number, page?: number, size?: number) =>
    get<{ records: any[]; total: number; pages: number }>(`/chats/messages/${targetUserId}`, { params: { page, size } })
      .then(res => ({ ...res, records: (res.records || []).map(normalizeMessage) })),
  sendMessage: (data: { receiverId: number; content: string; type: string; productId?: number }) =>
    post<any>('/chats/send', { receiverId: data.receiverId, content: data.content, messageType: data.type === 'text' ? 1 : data.type === 'image' ? 2 : 3, productId: data.productId })
      .then(normalizeMessage),
  markAsRead: (senderId: number) => put(`/chats/read/${senderId}`),
}

export interface Auction {
  id: number
  productId: number
  product: Product
  startPrice: number
  currentPrice: number
  minIncrement: number
  startTime: string
  endTime: string
  status: 'ongoing' | 'ended' | 'cancelled'
  bidCount: number
  highestBidderId?: number
  highestBidderName?: string
}

export interface Bid {
  id: number
  auctionId: number
  bidderId: number
  bidderName: string
  bidderAvatar: string
  amount: number
  createdAt: string
}

export const auctionApi = {
  list: (params?: { status?: string; page?: number; size?: number }) =>
    get<PageResponse<Auction>>('/auctions', { params }),
  detail: (id: number) => get<Auction>(`/auctions/${id}`),
  getBids: (auctionId: number) => get<Bid[]>(`/auctions/${auctionId}/bids`),
  placeBid: (auctionId: number, amount: number) => post<Bid>(`/auctions/${auctionId}/bids`, null, { params: { amount } }),
  create: (params: { productId: number; startingPrice: number; priceIncrement?: number; endTime: string; reservePrice?: number }) =>
    post<Auction>('/auctions', null, { params }),
  getMyAuctions: (params?: { status?: string; page?: number; size?: number }) =>
    get<PageResponse<Auction>>('/auctions/my', { params }),
}

export interface Post {
  id: number
  title: string
  content: string
  images: string[]
  authorId: number
  authorName: string
  authorAvatar: string
  tags: string[]
  likeCount: number
  commentCount: number
  isLiked: boolean
  createdAt: string
}

export interface Comment {
  id: number
  postId: number
  content: string
  authorId: number
  authorName: string
  authorAvatar: string
  parentId?: number
  replies?: Comment[]
  createdAt: string
}

function normalizePost(raw: any): Post {
  return {
    id: raw.id,
    title: raw.title || '',
    content: raw.content || '',
    images: raw.images || [],
    authorId: raw.authorId,
    authorName: raw.authorNickname || raw.authorName || '匿名用户',
    authorAvatar: raw.authorAvatar || '',
    tags: typeof raw.tags === 'string' ? (() => { try { return JSON.parse(raw.tags) } catch { return [] } })() : (raw.tags || []),
    likeCount: raw.likeCount || 0,
    commentCount: raw.commentCount || 0,
    isLiked: raw.isLiked || false,
    createdAt: raw.createdAt,
  }
}

function normalizeComment(raw: any): Comment {
  return {
    id: raw.id,
    postId: raw.postId,
    content: raw.content || '',
    authorId: raw.userId,
    authorName: raw.userNickname || raw.authorName || '匿名用户',
    authorAvatar: raw.userAvatar || raw.authorAvatar || '',
    parentId: raw.parentId,
    replies: [],
    createdAt: raw.createdAt,
  }
}

export interface Order {
  id: number
  orderNo: string
  buyerId: number
  buyerName: string
  buyerAvatar: string
  sellerId: number
  sellerName: string
  sellerAvatar: string
  productId: number
  productTitle: string
  productImage: string
  productPrice: number
  orderAmount: number
  status: number
  statusText: string
  tradeType: number
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  remark: string
  paidAt: string
  confirmedAt: string
  shippedAt: string
  completedAt: string
  cancelledAt: string
  cancelReason: string
  paymentNo: string
  buyerLatitude: number | null
  buyerLongitude: number | null
  buyerAddress: string | null
  sellerLatitude: number | null
  sellerLongitude: number | null
  sellerAddress: string | null
  createdAt: string
}

export const orderApi = {
  create: (data: { productId: number; receiverName?: string; receiverPhone?: string; receiverAddress?: string; remark?: string; buyerLatitude?: number; buyerLongitude?: number; buyerAddress?: string }) =>
    post<Order>('/orders', data),
  pay: (orderId: number) => post<Order>(`/orders/${orderId}/pay`),
  confirm: (orderId: number, latitude?: number, longitude?: number, address?: string) =>
    post<Order>(`/orders/${orderId}/confirm`, null, { params: { latitude, longitude, address } }),
  ship: (orderId: number, latitude?: number, longitude?: number, address?: string) =>
    post<Order>(`/orders/${orderId}/ship`, null, { params: { latitude, longitude, address } }),
  cancel: (orderId: number) => post<Order>(`/orders/${orderId}/cancel`),
  complete: (orderId: number) => post<Order>(`/orders/${orderId}/complete`),
  getDetail: (orderId: number) => get<Order>(`/orders/${orderId}`),
  getBuyOrders: (status?: number) => get<Order[]>('/orders/buy', { params: { status } }),
  getSellOrders: (status?: number) => get<Order[]>('/orders/sell', { params: { status } }),
}

export const locationApi = {
  updateMyLocation: (latitude: number, longitude: number, address?: string) =>
    post<void>('/location/update', null, { params: { latitude, longitude, address } }),
  getUserLocation: (userId: number) => get<{ userId: number; latitude: number; longitude: number; address: string }>(`/location/user/${userId}`),
}

export const communityApi = {
  getPosts: (params?: { tag?: string; sortBy?: string; page?: number; size?: number }) => {
    const queryParams: any = { ...params }
    if (params?.tag) {
      queryParams.category = params.tag
      delete queryParams.tag
    }
    if (params?.sortBy === 'hot') {
      queryParams.sortBy = 'hot'
    }
    return get<PageResponse<Post>>('/community/posts', { params: queryParams })
      .then(res => ({
        ...res,
        records: (res.records || []).map(normalizePost),
      }))
  },
  getPostDetail: (id: number) => get<Post>(`/community/posts/${id}`).then(normalizePost),
  createPost: (data: FormData) => post<Post>('/community/posts', data).then(normalizePost),
  getComments: (postId: number) =>
    get<PageResponse<Comment>>(`/community/posts/${postId}/comments`)
      .then(res => (res.records || []).map(normalizeComment)),
  createComment: (postId: number, data: { content: string; parentId?: number }) =>
    post<Comment>(`/community/posts/${postId}/comments`, data).then(normalizeComment),
  likePost: (postId: number) => post('/community/like', null, { params: { targetType: 1, targetId: postId } }),
  unlikePost: (postId: number) => post('/community/like', null, { params: { targetType: 1, targetId: postId } }),
}

export const browseHistoryApi = {
  getHistory: (limit?: number) => get<any[]>('/browse-history', { params: { limit: limit || 20 } })
    .then(list => (list || []).map(normalizeProduct)),
  removeHistory: (productId: number) => del(`/browse-history/${productId}`),
  clearHistory: () => del('/browse-history'),
}
