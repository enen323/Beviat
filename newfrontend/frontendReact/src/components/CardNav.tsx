// React Bits CardNav — adapted for Beviat search navigation
// Collapsed state: inline search input with suggestions
// Expanded state: category navigation cards only (no duplicate search)
import { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react'
import { gsap } from 'gsap'
import { GoArrowUpRight } from 'react-icons/go'
import './CardNav.scss'

interface CardNavLink {
  label: string
  href?: string
  ariaLabel?: string
  onClick?: () => void
}

interface CardNavItem {
  label: string
  bgColor: string
  textColor: string
  links: CardNavLink[]
}

interface SuggestionItem {
  label: string
  href?: string
  onClick?: () => void
}

interface CardNavProps {
  items: CardNavItem[]
  className?: string
  ease?: string
  baseColor?: string
  menuColor?: string
  buttonBgColor?: string
  buttonTextColor?: string
  onSearch?: (keyword: string) => void
  searchPlaceholder?: string
  suggestions?: SuggestionItem[]
  onSuggestionSelect?: (item: SuggestionItem) => void
}

const CardNav: React.FC<CardNavProps> = ({
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor = '#0071e3',
  buttonTextColor = '#fff',
  onSearch,
  searchPlaceholder = '搜索商品、用户、话题...',
  suggestions = [],
  onSuggestionSelect,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const calculateHeight = useCallback(() => {
    const navEl = navRef.current
    if (!navEl) return 260
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement
      if (contentEl) {
        const wasVisible = contentEl.style.visibility
        const wasPointerEvents = contentEl.style.pointerEvents
        const wasPosition = contentEl.style.position
        const wasHeight = contentEl.style.height

        contentEl.style.visibility = 'visible'
        contentEl.style.pointerEvents = 'auto'
        contentEl.style.position = 'static'
        contentEl.style.height = 'auto'
        contentEl.offsetHeight

        const topBar = 36
        const padding = 12
        const contentHeight = contentEl.scrollHeight

        contentEl.style.visibility = wasVisible
        contentEl.style.pointerEvents = wasPointerEvents
        contentEl.style.position = wasPosition
        contentEl.style.height = wasHeight

        return topBar + contentHeight + padding
      }
    }
    return 280
  }, [])

  const createTimeline = useCallback(() => {
    const navEl = navRef.current
    if (!navEl) return null

    gsap.set(navEl, { height: 36, overflow: 'hidden' })
    gsap.set(cardsRef.current.filter(Boolean), { y: 30, opacity: 0 })

    const tl = gsap.timeline({ paused: true })

    tl.to(navEl, {
      height: calculateHeight(),
      duration: 0.35,
      ease,
    })

    // After expanding, remove overflow:hidden so content is interactive
    tl.set(navEl, { overflow: 'visible' })

    tl.to(
      cardsRef.current.filter(Boolean),
      { y: 0, opacity: 1, duration: 0.3, ease, stagger: 0.06 },
      '-=0.1'
    )

    return tl
  }, [ease, calculateHeight, items])

  useLayoutEffect(() => {
    const tl = createTimeline()
    tlRef.current = tl

    return () => {
      tl?.kill()
      tlRef.current = null
    }
  }, [createTimeline])

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return

      if (isExpanded) {
        const newHeight = calculateHeight()
        gsap.set(navRef.current, { height: newHeight })

        tlRef.current.kill()
        const newTl = createTimeline()
        if (newTl) {
          newTl.progress(1)
          tlRef.current = newTl
        }
      } else {
        tlRef.current.kill()
        const newTl = createTimeline()
        if (newTl) {
          tlRef.current = newTl
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isExpanded, calculateHeight, createTimeline])

  const toggleMenu = useCallback(() => {
    const tl = tlRef.current
    if (!tl) return

    if (!isExpanded) {
      setIsHamburgerOpen(true)
      setIsExpanded(true)
      setShowSuggestions(false)
      tl.play(0)
    } else {
      setIsHamburgerOpen(false)
      // Restore overflow:hidden before reversing so the collapse animates correctly
      gsap.set(navRef.current, { overflow: 'hidden' })
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false))
      tl.reverse()
    }
  }, [isExpanded])

  const handleSearch = useCallback(() => {
    if (searchKeyword.trim()) {
      onSearch?.(searchKeyword.trim())
      setShowSuggestions(false)
      // Close after search
      if (isExpanded) {
        toggleMenu()
      }
    }
  }, [searchKeyword, onSearch, isExpanded, toggleMenu])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch()
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        if (isExpanded) {
          toggleMenu()
        }
      }
    },
    [handleSearch, isExpanded, toggleMenu]
  )

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value)
    setShowSuggestions(e.target.value.trim().length > 0)
  }, [])

  const handleSuggestionClick = useCallback((item: SuggestionItem) => {
    if (item.onClick) {
      item.onClick()
    } else if (item.href) {
      window.location.href = item.href
    } else {
      onSuggestionSelect?.(item)
    }
    setSearchKeyword(item.label)
    setShowSuggestions(false)
  }, [onSuggestionSelect])

  const handleInputFocus = useCallback(() => {
    if (searchKeyword.trim().length > 0 && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }, [searchKeyword, suggestions])

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    cardsRef.current[i] = el
  }

  return (
    <div ref={containerRef} className={`card-nav-container ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'card-nav--open' : ''}`}
        style={{ backgroundColor: baseColor }}
      >
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'hamburger-menu--open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? '关闭分类' : '打开分类'}
            tabIndex={0}
            style={{ color: menuColor || '#1D1D1F' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="card-nav-search-mini">
            <span className="search-mini-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={searchKeyword}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder={searchPlaceholder}
              className="search-mini-input"
            />
            {searchKeyword && (
              <span
                className="search-mini-clear"
                onClick={() => {
                  setSearchKeyword('')
                  setShowSuggestions(false)
                  inputRef.current?.focus()
                }}
              >
                &times;
              </span>
            )}
          </div>

          <button
            type="button"
            className="card-nav-cta-button"
            style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            onClick={handleSearch}
          >
            搜索
          </button>
        </div>

        {/* Suggestions dropdown - only in collapsed state */}
        {showSuggestions && !isExpanded && suggestions.length > 0 && (
          <div className="card-nav-suggestions">
            {suggestions.map((item, idx) => (
              <div
                key={`suggestion-${idx}`}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(item)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="suggestion-icon">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="suggestion-text">{item.label}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="suggestion-arrow">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            ))}
          </div>
        )}

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {/* No search card in expanded state - search is already in the top bar */}

          {/* Navigation category cards */}
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel}
                    onClick={(e) => {
                      if (lnk.onClick) {
                        e.preventDefault()
                        lnk.onClick()
                      }
                    }}
                  >
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default CardNav
