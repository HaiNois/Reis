import { useEffect, useState, useCallback, useRef } from 'react'

interface UseParallaxOptions {
  speed?: number // Multiplier for parallax effect (default: 0.3)
  direction?: 'up' | 'down' // Direction of parallax (default: 'up')
  maxOffset?: number // Maximum pixel offset (default: undefined = unlimited)
}

export function useParallax(options: UseParallaxOptions = {}) {
  const { speed = 0.3, direction = 'up', maxOffset } = options
  const [offset, setOffset] = useState(0)
  const ticking = useRef(false)

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY
        let newOffset = scrollY * speed

        if (direction === 'down') {
          newOffset = -newOffset
        }

        if (maxOffset !== undefined) {
          newOffset = Math.min(Math.max(newOffset, -maxOffset), maxOffset)
        }

        setOffset(newOffset)
        ticking.current = false
      })
      ticking.current = true
    }
  }, [speed, direction, maxOffset])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return offset
}

// Scale parallax (zoom effect on scroll)
interface UseScaleParallaxOptions {
  minScale?: number // Minimum scale when at top (default: 1)
  maxScale?: number // Maximum scale when scrolled (default: 1.05)
  maxScroll?: number // Scroll pixels to reach max scale (default: 500)
}

export function useScaleParallax(options: UseScaleParallaxOptions = {}) {
  const { minScale = 1, maxScale = 1.05, maxScroll = 500 } = options
  const [scale, setScale] = useState(minScale)
  const ticking = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY
          const progress = Math.min(scrollY / maxScroll, 1)
          const newScale = minScale + (maxScale - minScale) * progress
          setScale(newScale)
          ticking.current = false
        })
        ticking.current = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [minScale, maxScale, maxScroll])

  return scale
}
