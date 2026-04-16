import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

export interface StaggeredMenuItem {
  icon: React.ReactNode;
  label: string;
  ariaLabel?: string;
  link?: string;
  onClick?: () => void;
  color?: string;
}

export interface StaggeredMenuProps {
  items?: StaggeredMenuItem[];
  menuButtonColor?: string;
  accentColor?: string;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  marqueeSpeed?: number;
  className?: string;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  items = [],
  menuButtonColor = '#fff',
  accentColor = '#5227FF',
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
  marqueeSpeed = 12,
  className,
}: StaggeredMenuProps) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);

  // Marquee refs per item
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const overlayRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const trackRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const marqueeTweens = useRef<Map<number, gsap.core.Tween>>(new Map());
  const resetTweens = useRef<Map<number, gsap.core.Tween>>(new Map());

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      if (!panel || !plusH || !plusV || !icon) return;

      gsap.set(panel, { xPercent: 100 });
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-item')) as HTMLElement[];

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 120, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    tl.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: 'power4.out' });

    if (itemEls.length) {
      tl.to(
        itemEls,
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power4.out',
          stagger: { each: 0.07, from: 'start' },
        },
        0.12
      );
    }

    openTlRef.current = tl;
    return tl;
  }, []);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;

    const panel = panelRef.current;
    if (!panel) return;

    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to(panel, {
      xPercent: 100,
      duration: 0.3,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-item')) as HTMLElement[];
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 120, opacity: 0 });
        }
        busyRef.current = false;
      }
    });
  }, []);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    if (opening) {
      spinTweenRef.current = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
    } else {
      spinTweenRef.current = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }, []);

  // ---- FlowingMenu-style marquee hover ----
  const startMarquee = useCallback((idx: number) => {
    const trackEl = trackRefs.current.get(idx);
    if (!trackEl) return;

    const existingMarquee = marqueeTweens.current.get(idx);
    if (existingMarquee) {
      existingMarquee.kill();
      marqueeTweens.current.delete(idx);
    }
    const existingReset = resetTweens.current.get(idx);
    if (existingReset) {
      existingReset.kill();
      resetTweens.current.delete(idx);
    }
    gsap.killTweensOf(trackEl);

    const singleSpan = trackEl.querySelector('.sm-marquee-text') as HTMLElement;
    if (!singleSpan) return;
    const spanWidth = singleSpan.offsetWidth + 24;

    gsap.set(trackEl, { x: 0 });
    const tween = gsap.fromTo(
      trackEl,
      { x: 0 },
      { x: -spanWidth, duration: marqueeSpeed / 10, ease: 'none', repeat: -1 }
    );
    marqueeTweens.current.set(idx, tween);
  }, [marqueeSpeed]);

  const stopMarquee = useCallback((idx: number) => {
    const trackEl = trackRefs.current.get(idx);
    const existingMarquee = marqueeTweens.current.get(idx);
    if (existingMarquee) {
      existingMarquee.kill();
      marqueeTweens.current.delete(idx);
    }

    if (trackEl) {
      const existingReset = resetTweens.current.get(idx);
      if (existingReset) existingReset.kill();
      const tween = gsap.to(trackEl, {
        x: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          resetTweens.current.delete(idx);
        },
      });
      resetTweens.current.set(idx, tween);
    }
  }, []);

  const handleItemMouseEnter = useCallback((idx: number) => {
    const itemEl = itemRefs.current.get(idx);
    const overlayEl = overlayRefs.current.get(idx);

    if (itemEl) itemEl.classList.add('sm-item--hovered');
    if (overlayEl) {
      gsap.killTweensOf(overlayEl);
      gsap.to(overlayEl, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    }
    startMarquee(idx);
  }, [startMarquee]);

  const handleItemMouseLeave = useCallback((idx: number) => {
    const itemEl = itemRefs.current.get(idx);
    const overlayEl = overlayRefs.current.get(idx);

    if (itemEl) itemEl.classList.remove('sm-item--hovered');
    if (overlayEl) {
      gsap.killTweensOf(overlayEl);
      gsap.to(overlayEl, { opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
    stopMarquee(idx);
  }, [stopMarquee]);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateIcon(target);
  }, [playOpen, playClose, animateIcon, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
    }
  }, [playClose, animateIcon, onMenuClose]);

  React.useEffect(() => {
    if (!closeOnClickAway || !open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu]);

  // Cleanup marquee tweens on unmount
  React.useEffect(() => {
    return () => {
      marqueeTweens.current.forEach(t => t.kill());
      resetTweens.current.forEach(t => t.kill());
    };
  }, []);

  const repeats = 6;

  return (
    <div
      className={(className ? className + ' ' : '') + 'staggered-menu-wrapper'}
      style={accentColor ? { ['--sm-accent' as any]: accentColor } : undefined}
      data-open={open || undefined}
    >
      {/* Toggle button - fixed right side */}
      <button
        ref={toggleBtnRef}
        className="sm-toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="staggered-menu-panel"
        onClick={toggleMenu}
        type="button"
      >
        <span ref={iconRef} className="sm-icon" aria-hidden="true">
          <span ref={plusHRef} className="sm-icon-line" />
          <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
        </span>
      </button>

      {/* Panel */}
      <aside id="staggered-menu-panel" ref={panelRef} className="staggered-menu-panel" aria-hidden={!open}>
        <div className="sm-panel-inner">
          <ul className="sm-panel-list" role="list">
            {items && items.length ? (
              items.map((it, idx) => {
                const itemColor = it.color || accentColor;
                return (
                  <li className="sm-panel-itemWrap" key={it.label + idx}>
                    <a
                      ref={(el) => { if (el) itemRefs.current.set(idx, el); }}
                      className="sm-panel-item"
                      href={it.onClick ? undefined : it.link}
                      aria-label={it.ariaLabel || it.label}
                      onClick={it.onClick ? (e) => {
                        e.preventDefault();
                        it.onClick!();
                        closeMenu();
                      } : undefined}
                      style={{ '--item-color': itemColor } as React.CSSProperties}
                      onMouseEnter={() => handleItemMouseEnter(idx)}
                      onMouseLeave={() => handleItemMouseLeave(idx)}
                    >
                      {/* Icon only */}
                      <span className="sm-item-icon">{it.icon}</span>

                      {/* FlowingMenu-style marquee overlay */}
                      <div
                        ref={(el) => { if (el) overlayRefs.current.set(idx, el); }}
                        className="sm-item-overlay"
                        style={{ opacity: 0, '--marquee-bg': itemColor } as React.CSSProperties}
                      >
                        <div className="sm-marquee">
                          <div
                            ref={(el) => { if (el) trackRefs.current.set(idx, el); }}
                            className="sm-marquee-track"
                          >
                            {Array.from({ length: repeats }).map((_, i) => (
                              <span key={i} className="sm-marquee-text">
                                <span className="sm-marquee-icon">{it.icon}</span>
                                {it.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </a>
                  </li>
                );
              })
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-item-icon">🫙</span>
                </span>
              </li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default StaggeredMenu;
