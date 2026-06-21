// 简易 HTTP 代理 - 静态文件 + API 反向代理
import { createServer } from 'node:http'
import { request, createReadStream, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { lookup } from 'node:dns'

const PORT = 5173
const BACKEND_PORT = 8080
const MIME = Object.assign(Object.create(null), {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
})

function serveStatic(res, pathname) {
  const filePath = join('dist', pathname)
  if (!existsSync(filePath)) {
    const indexReq = request({ hostname: 'localhost', port: BACKEND_PORT, path: '/' }, () => {})
    indexReq.end()
    // SPA fallback: serve index.html for client-side routing
    const fallbackPath = join('dist', 'index.html')
    if (existsSync(fallbackPath)) {
      const ext = extname(fallbackPath)
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      createReadStream(fallbackPath).pipe(res)
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
    return
  }
  const ext = extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  createReadStream(filePath).pipe(res)
}

createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const pathname = url.pathname

  // 代理 /api/ 和 WebSocket 请求到后端
  if (pathname.startsWith('/api/') || pathname.startsWith('/ws')) {
    const proxyOpts = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${BACKEND_PORT}` },
    }
    const proxyReq = request(proxyOpts, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
      proxyRes.pipe(res)
    })
    proxyReq.on('error', () => {
      res.writeHead(502)
      res.end('Backend unavailable')
    })
    req.pipe(proxyReq)
    return
  }

  // SPA 路由：所有非 /api 请求返回静态文件
  const filePath = pathname === '/' ? '/index.html' : pathname
  serveStatic(res, filePath)
}).listen(PORT, () => {
  console.log(`[proxy] http://localhost:${PORT} -> backend :${BACKEND_PORT}`)
})
