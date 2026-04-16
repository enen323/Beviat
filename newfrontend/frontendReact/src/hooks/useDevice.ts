import { useState, useEffect } from 'react'

const PC_BREAKPOINT = 1024

export function useDevice() {
  const [isPC, setIsPC] = useState(window.innerWidth >= PC_BREAKPOINT)
  const [isMobile, setIsMobile] = useState(window.innerWidth < PC_BREAKPOINT)
  const [screenWidth, setScreenWidth] = useState(window.innerWidth)
  const [screenHeight, setScreenHeight] = useState(window.innerHeight)

  useEffect(() => {
    function updateDeviceType() {
      setScreenWidth(window.innerWidth)
      setScreenHeight(window.innerHeight)
      setIsPC(window.innerWidth >= PC_BREAKPOINT)
      setIsMobile(window.innerWidth < PC_BREAKPOINT)
    }

    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

  return { isPC, isMobile, screenWidth, screenHeight }
}
