import { create } from 'zustand'
import { userApi } from '@/api'

export interface UserInfo {
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

const USER_INFO_KEY = 'userInfo'

interface UserState {
  token: string
  userInfo: UserInfo | null
  initialized: boolean
  isLoggedIn: boolean
  userId: number | undefined
  setToken: (newToken: string) => void
  setUserInfo: (info: UserInfo) => void
  logout: () => void
  initFromStorage: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  token: '',
  userInfo: null,
  initialized: false,
  isLoggedIn: false,
  userId: undefined,

  setToken: (newToken: string) => {
    localStorage.setItem('token', newToken)
    set({ token: newToken, isLoggedIn: !!newToken && !!get().userInfo })
  },

  setUserInfo: (info: UserInfo) => {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
    set({ userInfo: info, isLoggedIn: !!get().token && !!info, userId: info.id })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem(USER_INFO_KEY)
    set({ token: '', userInfo: null, isLoggedIn: false, userId: undefined })
  },

  initFromStorage: async () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      set({ token: storedToken })

      const storedUserInfo = localStorage.getItem(USER_INFO_KEY)
      if (storedUserInfo) {
        try {
          const parsed = JSON.parse(storedUserInfo)
          set({ userInfo: parsed, isLoggedIn: true, userId: parsed.id })
        } catch {
          localStorage.removeItem(USER_INFO_KEY)
        }
      }

      if (!get().userInfo) {
        try {
          const profile = await userApi.getProfile()
          get().setUserInfo(profile)
        } catch {
          get().logout()
        }
      }
    }
    set({ initialized: true })
  },
}))
