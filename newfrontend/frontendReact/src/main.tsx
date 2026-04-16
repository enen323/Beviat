import React from 'react'
import ReactDOM from 'react-dom/client'
import '@ant-design/v5-patch-for-react-19'
import App from './App'
import { useUserStore } from './stores/user'
import 'virtual:uno.css'
import './styles/globals.css'
import './styles/index.scss'

// 恢复用户登录状态
const initApp = async () => {
  await useUserStore.getState().initFromStorage()
}

initApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
