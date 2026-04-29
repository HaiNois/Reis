import { useEffect, useRef, useState } from 'react'

/**
 * RAF-throttled scroll Y listener.
 * Returns window.scrollY updated at most once per animation frame.
 * Single event listener — safe to call from multiple components.
 */
export function useScrollYRaf(): number {
  const [scrollY, setScrollY] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY : 0
  )
  const ticking = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true
      window.requestAnimationFrame(() => {
        setScrollY(window.scrollY)
        ticking.current = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return scrollY
}
