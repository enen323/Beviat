import { useState } from 'react'
import './Folder.scss'

// 将 hex 颜色加深指定百分比
const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex
  if (color.length === 3) {
    color = color
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(color, 16)
  let r = (num >> 16) & 0xff
  let g = (num >> 8) & 0xff
  let b = num & 0xff
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))))
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))))
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}

export interface FolderItem {
  key: string
  label: string
  icon: React.ReactNode
  count?: number
  color?: string
  children?: React.ReactNode
}

export interface FolderProps {
  items: FolderItem[]
  defaultActiveKey?: string[]
}

const Folder: React.FC<FolderProps> = ({ items, defaultActiveKey = [] }) => {
  const [activeKeys, setActiveKeys] = useState<string[]>(defaultActiveKey)
  const [paperOffsets, setPaperOffsets] = useState<Record<string, { x: number; y: number }[]>>({})

  const maxPapers = 3

  const toggleFolder = (key: string) => {
    setActiveKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key)
      }
      return [...prev, key]
    })
    // 关闭时重置偏移
    if (activeKeys.includes(key)) {
      setPaperOffsets((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handlePaperMouseMove = (e: React.MouseEvent, folderKey: string, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const offsetX = (e.clientX - centerX) * 0.15
    const offsetY = (e.clientY - centerY) * 0.15

    setPaperOffsets((prev) => {
      const current = prev[folderKey] || Array.from({ length: maxPapers }, () => ({ x: 0, y: 0 }))
      const updated = [...current]
      updated[index] = { x: offsetX, y: offsetY }
      return { ...prev, [folderKey]: updated }
    })
  }

  const handlePaperMouseLeave = (folderKey: string, index: number) => {
    setPaperOffsets((prev) => {
      const current = prev[folderKey] || Array.from({ length: maxPapers }, () => ({ x: 0, y: 0 }))
      const updated = [...current]
      updated[index] = { x: 0, y: 0 }
      return { ...prev, [folderKey]: updated }
    })
  }

  return (
    <div className="folder-container">
      {/* 文件夹网格 - 展示所有文件夹 */}
      <div className="folder-grid">
        {items.map((item) => {
          const isOpen = activeKeys.includes(item.key)
          const color = item.color || '#0071e3'
          const folderBackColor = darkenColor(color, 0.08)
          const offsets = paperOffsets[item.key] || Array.from({ length: maxPapers }, () => ({ x: 0, y: 0 }))

          // 生成纸张内容（最多3个预览纸片）
          const previewItems = item.count ? Math.min(item.count, maxPapers) : 0
          const papers = Array.from({ length: maxPapers }, (_, i) => i)

          return (
            <div key={item.key} className={`folder-wrapper ${isOpen ? 'active' : ''}`}>
              {/* 3D 文件夹图标 */}
              <div
                className={`rb-folder ${isOpen ? 'open' : ''}`}
                style={{
                  '--folder-color': color,
                  '--folder-back-color': folderBackColor,
                  '--paper-1': darkenColor('#ffffff', 0.1),
                  '--paper-2': darkenColor('#ffffff', 0.05),
                  '--paper-3': '#ffffff',
                } as React.CSSProperties}
                onClick={() => toggleFolder(item.key)}
              >
                <div className="rb-folder__back">
                  {papers.map((i) => (
                    <div
                      key={i}
                      className={`rb-paper rb-paper-${i + 1}`}
                      onMouseMove={(e) => handlePaperMouseMove(e, item.key, i)}
                      onMouseLeave={() => handlePaperMouseLeave(item.key, i)}
                      style={
                        isOpen
                          ? {
                              '--magnet-x': `${offsets[i]?.x || 0}px`,
                              '--magnet-y': `${offsets[i]?.y || 0}px`,
                            }
                          : {}
                      }
                    >
                      {i < previewItems && (
                        <span className="rb-paper-content">{item.label}</span>
                      )}
                    </div>
                  ))}
                  <div className="rb-folder__front" />
                  <div className="rb-folder__front right" />
                </div>
              </div>

              {/* 文件夹标签 */}
              <div className="folder-label-section" onClick={() => toggleFolder(item.key)}>
                <span className="folder-icon-badge" style={{ color }}>
                  {item.icon}
                </span>
                <span className="folder-name">{item.label}</span>
                {item.count !== undefined && (
                  <span className="folder-count-badge">{item.count}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 展开的内容区域 */}
      {items.map((item) => {
        const isOpen = activeKeys.includes(item.key)
        if (!isOpen) return null
        return (
          <div key={`${item.key}-content`} className="folder-content-panel">
            <div className="folder-content-header">
              <span className="content-icon" style={{ color: item.color }}>{item.icon}</span>
              <h3 className="content-title">{item.label}</h3>
              {item.count !== undefined && (
                <span className="content-count">{item.count} 项</span>
              )}
              <button className="content-close" onClick={() => toggleFolder(item.key)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="folder-content-body">
              {item.children}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Folder
