// React Bits FlowingMenu — TypeScript + SCSS variant
// Hover to reveal a marquee overlay with icon & label, click to select
import { useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import './FlowingMenu.scss'

interface FlowingMenuItem {
  id: number
  name: string
  icon: React.ReactNode
  color: string
  link?: string
  image?: string
}

interface FlowingMenuProps {
  items: FlowingMenuItem[]
  activeId?: number
  onSelect?: (id: number) => void
  speed?: number
  textColor?: string
  bgColor?: string
  marqueeBgColor?: string
  marqueeTextColor?: string
  borderColor?: string
}

const FlowingMenu: React.FC<FlowingMenuProps> = ({
  items = [],
  activeId,
  onSelect,
  speed = 15,
  textColor = '#1D1D1F',
  bgColor = '#F5F5F7',
  marqueeBgColor,
  marqueeTextColor,
  borderColor = '#E5E5E7',
}) => {
  return (
    <div
      className="flowing-menu-rb"
      style={{
        '--fm-text-color': textColor,
        '--fm-bg-color': bgColor,
        '--fm-border-color': borderColor,
      } as React.CSSProperties}
    >
      {items.map((item, idx) => (
        <MenuItem
          key={item.id}
          item={item}
          idx={idx}
          speed={speed}
          isActive={activeId === item.id}
          marqueeBgColor={marqueeBgColor || item.color}
          marqueeTextColor={marqueeTextColor || '#fff'}
          borderColor={borderColor}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

interface MenuItemProps {
  item: FlowingMenuItem
  idx: number
  speed: number
  isActive: boolean
  marqueeBgColor: string
  marqueeTextColor: string
  borderColor: string
  onSelect?: (id: number) => void
}

function MenuItem({
  item,
  idx,
  speed,
  isActive,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
  onSelect,
}: MenuItemProps) {
  const itemRef = useRef<HTMLDivElement>(null)
  const marqueeTrackRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  // Use ref for hover state to avoid async React re-render lag
  const isHoveredRef = useRef(false)
  // Track the current GSAP tween so we can kill it precisely
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null)
  const resetTweenRef = useRef<gsap.core.Tween | null>(null)

  const startMarquee = useCallback(() => {
    const trackEl = marqueeTrackRef.current
    if (!trackEl) return

    // Kill any existing marquee and reset tweens
    if (marqueeTweenRef.current) {
      marqueeTweenRef.current.kill()
      marqueeTweenRef.current = null
    }
    if (resetTweenRef.current) {
      resetTweenRef.current.kill()
      resetTweenRef.current = null
    }

    // Also kill any loose tweens on the track element
    gsap.killTweensOf(trackEl)

    const singleSpan = trackEl.querySelector('.fm-marquee-text') as HTMLElement
    if (!singleSpan) return
    const spanWidth = singleSpan.offsetWidth + 24

    // Set starting position immediately
    gsap.set(trackEl, { x: 0 })

    marqueeTweenRef.current = gsap.fromTo(
      trackEl,
      { x: 0 },
      {
        x: -spanWidth,
        duration: speed / 10,
        ease: 'none',
        repeat: -1,
      }
    )
  }, [speed])

  const stopMarquee = useCallback(() => {
    const trackEl = marqueeTrackRef.current
    if (!trackEl) return

    // Kill the looping marquee tween
    if (marqueeTweenRef.current) {
      marqueeTweenRef.current.kill()
      marqueeTweenRef.current = null
    }
    if (resetTweenRef.current) {
      resetTweenRef.current.kill()
    }

    // Smoothly reset position
    resetTweenRef.current = gsap.to(trackEl, {
      x: 0,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => {
        resetTweenRef.current = null
      },
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true

    // Update CSS class immediately via DOM for instant visual feedback
    if (itemRef.current) {
      itemRef.current.classList.add('fm-item--hovered')
    }

    // Fade in overlay
    if (overlayRef.current) {
      gsap.killTweensOf(overlayRef.current)
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.25, ease: 'power2.out' })
    }

    // Start marquee animation
    startMarquee()
  }, [startMarquee])

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false

    // Update CSS class immediately
    if (itemRef.current) {
      itemRef.current.classList.remove('fm-item--hovered')
    }

    // Fade out overlay
    if (overlayRef.current) {
      gsap.killTweensOf(overlayRef.current)
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' })
    }

    // Stop marquee animation
    stopMarquee()
  }, [stopMarquee])

  const handleClick = useCallback(() => {
    onSelect?.(item.id)
  }, [item.id, onSelect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (marqueeTweenRef.current) {
        marqueeTweenRef.current.kill()
      }
      if (resetTweenRef.current) {
        resetTweenRef.current.kill()
      }
      if (overlayRef.current) {
        gsap.killTweensOf(overlayRef.current)
      }
      if (marqueeTrackRef.current) {
        gsap.killTweensOf(marqueeTrackRef.current)
      }
    }
  }, [])

  const repeats = 6

  return (
    <div
      ref={itemRef}
      className={`fm-item ${isActive ? 'fm-item--active' : ''}`}
      style={{
        '--item-color': item.color,
        '--marquee-bg': marqueeBgColor,
        '--marquee-text': marqueeTextColor,
      } as React.CSSProperties}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Base content */}
      <div className="fm-item-base">
        <span className="fm-item-icon">{item.icon}</span>
        <span className="fm-item-label">{item.name}</span>
      </div>

      {/* Hover marquee overlay */}
      <div ref={overlayRef} className="fm-item-overlay" style={{ opacity: 0 }}>
        <div className="fm-marquee">
          <div ref={marqueeTrackRef} className="fm-marquee-track">
            {Array.from({ length: repeats }).map((_, i) => (
              <span key={i} className="fm-marquee-text">
                <span className="fm-marquee-icon">{item.icon}</span>
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Active indicator */}
      {isActive && <div className="fm-item-indicator" />}
    </div>
  )
}

export default FlowingMenu
