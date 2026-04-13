import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useEmblaCarousel from 'embla-carousel-react'
import { Link } from 'react-router-dom'
import { useInView } from '@/hooks/useInView'
import { SectionHeader } from './SectionHeader'
import { ProductCard } from './ProductCard'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface FeaturedProductsSectionProps {
  title?: string
  titleEn?: string
  subtitle?: string
  subtitleEn?: string
  products: Array<{
    id: string
    slug: string
    name: string
    nameEn?: string
    price: number
    images: string[]
    isNew?: boolean
    isSale?: boolean
    salePrice?: number
  }>
  viewAllUrl?: string
}

export function FeaturedProductsSection({
  title,
  titleEn,
  subtitle,
  subtitleEn,
  products,
  viewAllUrl = '/products',
}: FeaturedProductsSectionProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const { ref: headerRef, isInView: headerInView } = useInView<HTMLDivElement>({ threshold: 0.2 })

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const totalSlides = products.length

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  // Update selected index and scroll progress
  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap()
      setSelectedIndex(index)

      const progress = (index / (totalSlides - 1)) * 100
      setScrollProgress(Math.min(progress, 100))
    }

    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    // Initial calculation
    onSelect()

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, totalSlides])

  const displayTitle = lang === 'en' && titleEn ? titleEn : title
  const displaySubtitle = lang === 'en' && subtitleEn ? subtitleEn : subtitle

  if (!products?.length) return null

  // Calculate peek-through: visible portions
  // Mobile: 1.25 products = basis-[80%] + 20% peek on right
  // Tablet: 2.5 products = basis-[40%] + 20% peek on right
  // Desktop: 4 products = basis-[25%]

  return (
    <section className="py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="container-custom">
        {/* Header */}
        <div ref={headerRef}>
          <SectionHeader
            title={displayTitle || (lang === 'en' ? 'Featured Products' : 'Sản Phẩm Nổi Bật')}
            subtitle={displaySubtitle}
            viewAllUrl={viewAllUrl}
            alignment="left"
          />
        </div>

        {/* Carousel container */}
        <div className="relative group/carousel mt-8 md:mt-10">
          {/* Carousel viewport */}
          <div
            ref={emblaRef}
            className="overflow-hidden cursor-grab active:cursor-grabbing"
          >
            <div
              className={cn(
                'flex',
                // Mobile: 1.25 products visible, peek on right
                'md:basis-[40%] md:pl-0',
                // Tablet: 2.5 products visible
                'lg:basis-[25%]'
              )}
            >
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={cn(
                    'flex-none pl-4 pr-4 group transition-transform duration-300',
                    'group-hover:scale-[1.02] group-hover:shadow-xl',
                    // Mobile: ~80% width (1.25 visible = 100/1.25 = 80%)
                    'min-w-[80%] md:min-w-[40%] lg:min-w-[25%]'
                  )}
                  style={{ transitionDelay: `${index * 75}ms` }}
                >
                  <ProductCard
                    {...product}
                    className={cn(
                      'transition-all duration-500',
                      headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows - visible on hover (desktop) */}
          <div className="hidden lg:flex absolute -right-16 top-1/2 -translate-y-1/2 gap-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <button
              onClick={scrollPrev}
              className={cn(
                'w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center',
                'transition-all duration-300 hover:scale-110 hover:bg-gray-100',
                !emblaApi?.canScrollPrev() && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={lang === 'en' ? 'Previous products' : 'Sản phẩm trước'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              className={cn(
                'w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center',
                'transition-all duration-300 hover:scale-110 hover:bg-gray-100',
                !emblaApi?.canScrollNext() && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={lang === 'en' ? 'Next products' : 'Sản phẩm tiếp theo'}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile navigation arrows */}
          <div className="flex lg:hidden justify-center gap-4 mt-8">
            <button
              onClick={scrollPrev}
              className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label={lang === 'en' ? 'Previous' : 'Trước'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollNext}
              className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label={lang === 'en' ? 'Next' : 'Tiếp'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dots navigation - manual only, no auto-play */}
          <div className="flex lg:hidden justify-center gap-2 mt-6">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  index === selectedIndex
                    ? 'bg-black w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Scroll progress indicator - thin bar */}
          <div className="hidden md:block h-0.5 bg-gray-100 mt-10 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>

        {/* View all link (mobile) */}
        <div className="flex lg:hidden justify-center mt-8">
          <Link
            to={viewAllUrl}
            className="text-sm font-medium tracking-wide border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors"
          >
            {lang === 'en' ? 'View all products' : 'Xem tất cả sản phẩm'}
          </Link>
        </div>
      </div>
    </section>
  )
}
