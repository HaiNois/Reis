import { useEffect, useRef, useState } from 'react'

interface UseScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', triggerOnce = true } = options
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isVisible }
}

// Staggered reveal for list items
export function useStaggeredReveal<T extends HTMLElement = HTMLElement>(
  itemCount: number,
  baseDelay: number = 50,
  options: UseScrollRevealOptions = {}
) {
  const { ref, isVisible } = useScrollReveal<T>(options)
  const [visibleItems, setVisibleItems] = useState<number>(0)

  useEffect(() => {
    if (!isVisible) {
      setVisibleItems(0)
      return
    }

    let current = 0
    const interval = setInterval(() => {
      current++
      setVisibleItems(current)
      if (current >= itemCount) {
        clearInterval(interval)
      }
    }, baseDelay)

    return () => clearInterval(interval)
  }, [isVisible, itemCount, baseDelay])

  return { ref, isVisible, visibleItems }
}