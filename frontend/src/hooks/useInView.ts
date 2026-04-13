import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  threshold?: number | number[]
  rootMargin?: string
  triggerOnce?: boolean
  root?: Element | null
}

export function useInView<T extends HTMLElement = HTMLElement>(
  options: UseInViewOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    root = null,
  } = options
  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting
        setIsInView(inView)

        if (inView && triggerOnce) {
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin, root }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce, root])

  return { ref, isInView }
}

// Staggered children reveal
interface UseStaggeredInViewOptions extends UseInViewOptions {
  staggerDelay?: number // Delay between each child reveal in ms (default: 50)
}

export function useStaggeredInView<T extends HTMLElement = HTMLElement>(
  childCount: number,
  options: UseStaggeredInViewOptions = {}
) {
  const { staggerDelay = 50, triggerOnce = true, ...inViewOptions } = options
  const { ref, isInView } = useInView<T>({ ...inViewOptions, triggerOnce })
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!isInView) {
      setVisibleCount(0)
      return
    }

    if (triggerOnce) {
      // Immediately show all when in view (triggerOnce)
      setVisibleCount(childCount)
      return
    }

    // Progressive reveal for non-triggerOnce mode
    let current = 0
    const interval = setInterval(() => {
      current++
      setVisibleCount(current)
      if (current >= childCount) {
        clearInterval(interval)
      }
    }, staggerDelay)

    return () => clearInterval(interval)
  }, [isInView, childCount, staggerDelay, triggerOnce])

  return { ref, isInView, visibleCount }
}

// Hook to get transition class based on visibility
export function getRevealTransition(
  isVisible: boolean,
  baseClass: string = 'opacity-0 translate-y-8',
  visibleClass: string = 'opacity-100 translate-y-0'
): string {
  return `${baseClass} transition-all duration-700 ${isVisible ? visibleClass : ''}`
}

// Staggered delay helper - returns inline style for transition-delay
export function getStaggerDelay(index: number, baseDelay: number = 50): { transitionDelay: string } {
  return { transitionDelay: `${index * baseDelay}ms` }
}
