import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Returns true when the user has requested reduced motion via OS/browser settings.
 * Use to disable parallax, auto-play, or heavy CSS animations for accessibility.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(QUERY).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handleChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)

    // Modern browsers
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return prefersReduced
}
