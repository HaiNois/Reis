// Custom hooks for AnnouncementBar
import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAnnouncementRotationOptions {
  count: number
  interval: number
  pauseOnHover: boolean
}

interface UseAnnouncementRotationReturn {
  currentIndex: number
  setHovered: (hovered: boolean) => void
  prefersReducedMotion: boolean
}

/**
 * Manages auto-rotation of announcement messages.
 * Pauses when hovered or when user prefers reduced motion.
 */
export function useAnnouncementRotation({
  count,
  interval,
  pauseOnHover,
}: UseAnnouncementRotationOptions): UseAnnouncementRotationReturn {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Detect prefers-reduced-motion media query
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  // Auto-rotate via setInterval; pause when hovered or reduced motion
  useEffect(() => {
    if (count <= 1 || prefersReducedMotion) return
    if (pauseOnHover && isHovered) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count)
    }, interval)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [count, interval, pauseOnHover, isHovered, prefersReducedMotion])

  const setHovered = useCallback((hovered: boolean) => {
    setIsHovered(hovered)
  }, [])

  return { currentIndex, setHovered, prefersReducedMotion }
}

interface UseDismissibleBarReturn {
  isDismissed: boolean
  dismiss: () => void
}

/**
 * Persists dismissal state in localStorage so the bar stays hidden
 * across page refreshes until the storage key is cleared.
 */
export function useDismissibleBar(storageKey: string): UseDismissibleBarReturn {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === 'true'
    } catch {
      return false
    }
  })

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // localStorage unavailable (e.g. private browsing), fail silently
    }
    setIsDismissed(true)
  }, [storageKey])

  return { isDismissed, dismiss }
}
