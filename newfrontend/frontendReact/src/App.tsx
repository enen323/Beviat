import { RouterProvider, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from './router'

function TitleUpdater() {
  const location = useLocation()
  useEffect(() => {
    // Find the matching route and set the title
    const routes = router.routes || []
    const currentRoute = routes.find((r: any) => {
      if (r.path === '*') return false
      if (r.path === location.pathname) return true
      // Handle dynamic routes
      if (r.path?.includes(':')) {
        const regex = new RegExp('^' + r.path.replace(/:[^/]+/g, '[^/]+') + '$')
        return regex.test(location.pathname)
      }
      return false
    })
    document.title = (currentRoute as any)?.handle?.title || 'Beviat - 校园二手交易平台'
  }, [location])
  return null
}

function App() {
  return <RouterProvider router={router} />
}

export default App
