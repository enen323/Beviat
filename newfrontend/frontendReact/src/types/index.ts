export interface BaseEntity {
  id: number
  createdAt: string
  updatedAt: string
}

export interface PageQuery {
  page?: number
  size?: number
}

export interface Response<T = any> {
  code: number
  message: string
  data: T
}

export type DeviceType = 'pc' | 'mobile'

export type ProductStatus = 'available' | 'sold' | 'reserved'

export type AuctionStatus = 'ongoing' | 'ended' | 'cancelled'

export type MessageType = 'text' | 'image' | 'product'

export interface UploadResponse {
  url: string
  filename: string
}
