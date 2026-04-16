import React from 'react'
import { useDevice } from '@/hooks/useDevice'
import PCLayout from './PCLayout'
import MobileLayout from './MobileLayout'

const ResponsiveLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPC } = useDevice()

  if (isPC) {
    return <PCLayout>{children}</PCLayout>
  }
  return <MobileLayout>{children}</MobileLayout>
}

export default ResponsiveLayout
