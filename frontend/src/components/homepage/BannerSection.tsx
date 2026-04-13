import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useParallax } from '@/hooks/useParallax'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'

interface BannerItem {
  id: string
  title: string
  titleEn?: string
  subtitle?: string
  subtitleEn?: string
  ctaLabel?: string
  ctaLabelEn?: string
  ctaUrl?: string
  imageUrl: string
  mobileImageUrl?: string
  textPosition?: 'left' | 'center' | 'right'
}

interface BannerSectionProps {
  layout?: 'split-left' | 'split-right' | 'triple'
  banners: BannerItem[]
}

export function BannerSection({
  layout = 'split-left',
  banners,
}: BannerSectionProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 })

  // Parallax: left 0.2x, right stack 0.1x
  const leftParallax = useParallax({ speed: 0.2, maxOffset: 100 })
  const rightParallax = useParallax({ speed: 0.1, maxOffset: 50 })

  if (!banners?.length) return null

  const getDisplayText = (banner: BannerItem) => ({
    title: lang === 'en' && banner.titleEn ? banner.titleEn : banner.title,
    subtitle: lang === 'en' && banner.subtitleEn ? banner.subtitleEn : banner.subtitle,
    ctaLabel: lang === 'en' && banner.ctaLabelEn ? banner.ctaLabelEn : banner.ctaLabel,
  })

  const textPositionClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }

  // Split layout: Left 60% (col-span-7) + Right stack 40% (col-span-5)
  // Total height: 70vh desktop
  if (layout === 'split-left' && banners.length >= 2) {
    const [leftBanner] = banners.slice(0, 2)
    const leftText = getDisplayText(leftBanner)

    return (
      <section className="py-12 md:py-16 lg:py-20">
        <div ref={ref} className="container-custom">
          {/* Split layout: Left 60% + Right 40% = 12 columns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {/* Left large banner - col-span-7 (60%) */}
            <div
              className={cn(
                'relative md:col-span-7 overflow-hidden rounded-lg',
                'h-[50vh] md:h-[70vh]',
                'transition-all duration-700',
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
            >
              <Link to={leftBanner.ctaUrl || '#'} className="block w-full h-full">
                <div
                  className="relative w-full h-full overflow-hidden"
                  style={{ transform: `translateY(${leftParallax}px)` }}
                >
                  <picture>
                    <source
                      media="(max-width: 768px)"
                      srcSet={leftBanner.mobileImageUrl || leftBanner.imageUrl}
                    />
                    <img
                      src={leftBanner.imageUrl}
                      alt={leftText.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </picture>
                  {/* Gradient overlay: dark-to-transparent editorial style */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col',
                    textPositionClasses[leftBanner.textPosition || 'left']
                  )}
                >
                  {leftText.subtitle && (
                    <p className="text-white/80 text-sm uppercase tracking-[0.2em] mb-2">
                      {leftText.subtitle}
                    </p>
                  )}
                  <h3 className="text-white text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-wide mb-4 md:mb-6">
                    {leftText.title}
                  </h3>
                  {leftText.ctaLabel && (
                    <span className="inline-flex items-center gap-2 px-6 py-3 border border-white text-white text-sm font-medium tracking-wide hover:bg-white hover:text-black transition-all duration-300 w-fit">
                      <span>{leftText.ctaLabel}</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </Link>
            </div>

            {/* Right stacked banners - col-span-5 (40%) */}
            <div className="relative md:col-span-5 flex flex-col gap-4 md:gap-6">
              {banners.slice(0, 2).map((banner, index) => {
                const text = getDisplayText(banner)
                return (
                  <Link
                    key={banner.id}
                    to={banner.ctaUrl || '#'}
                    className={cn(
                      'relative flex-1 overflow-hidden rounded-lg',
                      'h-[24vh] md:h-[34vh]',
                      'transition-all duration-700',
                      isInView
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-8'
                    )}
                    style={{ transitionDelay: `${(index + 1) * 150}ms` }}
                  >
                    <div
                      className="relative w-full h-full"
                      style={{ transform: `translateY(${rightParallax * (index + 1)}px)` }}
                    >
                      <picture>
                        <source
                          media="(max-width: 768px)"
                          srcSet={banner.mobileImageUrl || banner.imageUrl}
                        />
                        <img
                          src={banner.imageUrl}
                          alt={text.title}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                      </picture>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    </div>
                    <div
                      className={cn(
                        'absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col',
                        textPositionClasses[banner.textPosition || 'left']
                      )}
                    >
                      {text.subtitle && (
                        <p className="text-white/70 text-xs uppercase tracking-[0.15em] mb-1">
                          {text.subtitle}
                        </p>
                      )}
                      <h3 className="text-white text-lg md:text-xl font-display font-bold tracking-wide">
                        {text.title}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Triple layout: 3 equal columns
  if (layout === 'triple' && banners.length >= 3) {
    return (
      <section className="py-12 md:py-16 lg:py-20">
        <div ref={ref} className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-[50vh] md:h-[70vh]">
            {banners.slice(0, 3).map((banner, index) => {
              const text = getDisplayText(banner)
              return (
                <Link
                  key={banner.id}
                  to={banner.ctaUrl || '#'}
                  className={cn(
                    'relative overflow-hidden rounded-lg',
                    'transition-all duration-700',
                    isInView
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  )}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="relative w-full h-full">
                    <picture>
                      <source
                        media="(max-width: 768px)"
                        srcSet={banner.mobileImageUrl || banner.imageUrl}
                      />
                      <img
                        src={banner.imageUrl}
                        alt={text.title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                  <div
                    className={cn(
                      'absolute bottom-0 left-0 right-0 p-6 flex flex-col',
                      textPositionClasses[banner.textPosition || 'center']
                    )}
                  >
                    {text.subtitle && (
                      <p className="text-white/70 text-xs uppercase tracking-[0.15em] mb-2">
                        {text.subtitle}
                      </p>
                    )}
                    <h3 className="text-white text-xl md:text-2xl font-display font-bold tracking-wide">
                      {text.title}
                    </h3>
                    {text.ctaLabel && (
                      <span className="mt-3 inline-flex items-center gap-2 text-sm text-white/80 group-hover:text-white">
                        <span>{text.ctaLabel}</span>
                        <span>→</span>
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  // Fallback: horizontal scroll of banners
  return (
    <section className="py-12 md:py-16 lg:py-20 overflow-hidden">
      <div ref={ref} className="container-custom">
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {banners.map((banner, index) => {
            const text = getDisplayText(banner)
            return (
              <Link
                key={banner.id}
                to={banner.ctaUrl || '#'}
                className={cn(
                  'relative flex-none w-[85vw] md:w-[45vw] lg:w-[30vw] aspect-[4/5] md:aspect-[3/4] snap-center overflow-hidden rounded-lg',
                  'transition-all duration-700',
                  isInView
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <img
                  src={banner.mobileImageUrl || banner.imageUrl}
                  alt={text.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 p-6 flex flex-col',
                    textPositionClasses[banner.textPosition || 'center']
                  )}
                >
                  <h3 className="text-white text-xl md:text-2xl font-display font-bold">
                    {text.title}
                  </h3>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
