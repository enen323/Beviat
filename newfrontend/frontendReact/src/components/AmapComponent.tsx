import { useEffect, useRef, useState } from 'react'
import { Input, message } from 'antd'
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons'
import './AmapComponent.scss'

// 高德地图配置 - 需要在index.html中引入JS API或动态加载
const AMAP_KEY = '我的KEY'  // 替换为实际key
const AMAP_SECURITY_CODE = '我的安全密钥' // 替换为实际安全密钥

interface AmapComponentProps {
  /** 地图容器高度 */
  height?: string | number
  /** 初始中心点 [lng, lat] */
  center?: [number, number]
  /** 初始缩放级别 */
  zoom?: number
  /** 是否显示搜索框 */
  showSearch?: boolean
  /** 是否显示定位按钮 */
  showGeolocation?: boolean
  /** 是否可选择位置（点击地图选点） */
  pickable?: boolean
  /** 位置选择回调 */
  onLocationPick?: (location: { lng: number; lat: number; address: string }) => void
  /** 已选中的标记点 */
  markers?: Array<{ lng: number; lat: number; label?: string; color?: string; role?: 'buyer' | 'seller' }>
  /** 定位成功回调 */
  onLocated?: (location: { lng: number; lat: number; address: string }) => void
}

// 声明全局AMap类型
declare global {
  interface Window {
    AMap: any
    _AMapSecurityConfig: any
  }
}

export default function AmapComponent({
  height = 400,
  center,
  zoom = 15,
  showSearch = true,
  showGeolocation = true,
  pickable = false,
  onLocationPick,
  markers = [],
  onLocated,
}: AmapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const searchInputRef = useRef<any>(null)
  const [searchValue, setSearchValue] = useState('')
  const [myLocation, setMyLocation] = useState<{ lng: number; lat: number; address: string } | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // 动态加载高德地图JS API
  const loadAMapScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.AMap) {
        resolve()
        return
      }
      // 设置安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: AMAP_SECURITY_CODE,
      }
      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=1.4.15&key=${AMAP_KEY}`
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('高德地图加载失败'))
      document.head.appendChild(script)
    })
  }

  // 初始化地图
  useEffect(() => {
    let isMounted = true
    loadAMapScript().then(() => {
      if (!isMounted || !mapContainerRef.current) return

      const map = new window.AMap.Map(mapContainerRef.current, {
        zoom,
        resizeEnable: true,
        center: center ? new window.AMap.LngLat(center[0], center[1]) : undefined,
      })
      mapRef.current = map
      setMapLoaded(true)

      // 定位插件
      if (showGeolocation) {
        window.AMap.plugin('AMap.Geolocation', () => {
          const geolocation = new window.AMap.Geolocation({
            enableHighAccuracy: true,
            timeout: 15000,
            zoomToAccuracy: true,
            buttonPosition: 'RB',
            buttonOffset: new window.AMap.Pixel(10, 20),
          })
          map.addControl(geolocation)
          geolocation.getCurrentPosition()

          window.AMap.event.addListener(geolocation, 'complete', (data: any) => {
            const loc = {
              lng: data.position.lng,
              lat: data.position.lat,
              address: data.formattedAddress || '',
            }
            setMyLocation(loc)
            onLocated?.(loc)
          })

          window.AMap.event.addListener(geolocation, 'error', (err: any) => {
            console.error('定位失败:', err)
          })
        })
      }

      // 搜索插件
      if (showSearch) {
        window.AMap.plugin(['AMap.Autocomplete', 'AMap.PlaceSearch'], () => {
          const autocomplete = new window.AMap.Autocomplete({
            city: '全国',
            input: 'amap-search-input',
          })

          const placeSearch = new window.AMap.PlaceSearch({
            city: '全国',
            map: map,
            panel: false,
          })

          window.AMap.event.addListener(autocomplete, 'select', (e: any) => {
            placeSearch.search(e.poi.name, (status: string, result: any) => {
              if (status === 'complete' && result.info === 'OK') {
                if (result.poiList && result.poiList.pois.length > 0) {
                  const poi = result.poiList.pois[0]
                  map.setCenter(poi.location)
                  map.setZoom(17)
                  if (pickable && onLocationPick) {
                    onLocationPick({
                      lng: poi.location.lng,
                      lat: poi.location.lat,
                      address: poi.address || poi.name,
                    })
                  }
                }
              }
            })
          })
        })
      }

      // 点击选点
      if (pickable) {
        map.on('click', (e: any) => {
          const lnglat = e.lnglat
          // 逆地理编码获取地址
          window.AMap.plugin('AMap.Geocoder', () => {
            const geocoder = new window.AMap.Geocoder()
            geocoder.getAddress(lnglat, (status: string, result: any) => {
              const address = status === 'complete' && result.info === 'OK'
                ? result.regeocode.formattedAddress
                : ''
              onLocationPick?.({
                lng: lnglat.lng,
                lat: lnglat.lat,
                address,
              })
            })
          })
        })
      }
    }).catch((err) => {
      console.error('地图加载失败:', err)
    })

    return () => {
      isMounted = false
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [])

  // 更新标记点
  useEffect(() => {
    if (!mapRef.current || !window.AMap) return
    // 清除旧标记
    const map = mapRef.current
    map.clearMap()

    // 添加标记
    markers.forEach((m) => {
      const isSeller = m.role === 'seller'
      const pinColor = m.color || (isSeller ? '#ff4d4f' : '#1677ff')
      const pinBg = isSeller ? '#fff1f0' : '#e6f4ff'
      const pinLabel = isSeller ? '卖' : '买'
      
      // 使用自定义HTML标记区分买卖双方
      const marker = new window.AMap.Marker({
        position: new window.AMap.LngLat(m.lng, m.lat),
        title: m.label || '',
        content: `<div class="amap-custom-marker" style="--pin-color: ${pinColor}; --pin-bg: ${pinBg};">
          <div class="amap-pin"><span class="amap-pin-label">${pinLabel}</span></div>
          <div class="amap-pin-arrow"></div>
        </div>`,
        offset: new window.AMap.Pixel(-16, -42),
        label: m.label ? {
          content: `<div class="amap-marker-label-custom" style="border-left: 3px solid ${pinColor};">${m.label}</div>`,
          offset: new window.AMap.Pixel(-50, -48),
        } : undefined,
      })
      map.add(marker)
    })

    // 自适应显示所有标记
    if (markers.length > 1) {
      map.setFitView()
    }
  }, [markers])

  return (
    <div className="amap-component">
      {showSearch && (
        <div className="amap-search-bar">
          <Input
            id="amap-search-input"
            prefix={<SearchOutlined />}
            placeholder="搜索地址/POI名称"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
          />
        </div>
      )}
      <div
        ref={mapContainerRef}
        className="amap-container"
        style={{ height }}
      />
      {myLocation && (
        <div className="amap-location-info">
          <EnvironmentOutlined /> 当前位置: {myLocation.address || `${myLocation.lat.toFixed(6)}, ${myLocation.lng.toFixed(6)}`}
        </div>
      )}
    </div>
  )
}
