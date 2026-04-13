import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useScaleParallax } from '@/hooks/useParallax'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  title?: string
  titleEn?: string
  subtitle?: string
  subtitleEn?: string
  ctaLabel?: string
  ctaLabelEn?: string
  ctaUrl?: string
  imageUrl?: string
  mobileImageUrl?: string
  eyebrow?: string
  eyebrowEn?: string
  overlayStyle?: 'dark' | 'light' | 'gradient'
  textAlign?: 'left' | 'center' | 'right'
}

export function HeroSection({
  title,
  titleEn,
  subtitle,
  subtitleEn,
  ctaLabel,
  ctaLabelEn,
  ctaUrl = '/products',
  imageUrl = '/images/banners/banner.jpg',
  mobileImageUrl,
  eyebrow,
  eyebrowEn,
  overlayStyle = 'gradient',
  textAlign = 'center',
}: HeroSectionProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const scale = useScaleParallax({ minScale: 1, maxScale: 1.05, maxScroll: 500 })

  const [scrollY, setScrollY] = useState(0)

  // Parallax effect: translateY 0.3x speed
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const displayTitle = lang === 'en' && titleEn ? titleEn : title
  const displaySubtitle = lang === 'en' && subtitleEn ? subtitleEn : subtitle
  const displayCtaLabel = lang === 'en' && ctaLabelEn ? ctaLabelEn : ctaLabel
  const displayEyebrow = lang === 'en' && eyebrowEn ? eyebrowEn : eyebrow

  // Staggered entrance delays
  const eyebrowDelay = '0ms'
  const titleDelay = '150ms'
  const subtitleDelay = '300ms'
  const ctaDelay = '450ms'

  const textPositionClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }

  return (
    <section className="relative bg-gray-100 overflow-hidden">
      {/* Full viewport height: 100vh desktop, 80vh mobile */}
      <div
        className={cn(
          'relative w-full will-change-transform overflow-hidden',
          'min-h-[80vh] md:min-h-screen'
        )}
        style={{
          transform: `translateY(${scrollY * 0.3}px) scale(${scale})`,
        }}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet={mobileImageUrl || imageUrl} />
          <img
            src={imageUrl}
            alt={displayTitle || 'Hero'}
            className="w-full h-full object-cover"
          />
        </picture>

        {/* Gradient overlay: dark-to-transparent editorial style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Content */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col justify-center',
            textPositionClasses[textAlign]
          )}
        >
          <div className="container-custom">
            {/* Eyebrow text - staggered entrance */}
            {displayEyebrow && (
              <p
                className="text-white/80 uppercase tracking-[0.2em] text-sm md:text-base mb-4 md:mb-6"
                style={{
                  animation: `fadeInUp 0.8s ease-out ${eyebrowDelay} both`,
                }}
              >
                {displayEyebrow}
              </p>
            )}

            {/* Title - staggered entrance */}
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-wide text-white mb-4 md:mb-6"
              style={{
                animation: `fadeInUp 0.8s ease-out ${titleDelay} both`,
              }}
            >
              {displayTitle}
            </h1>

            {/* Subtitle - staggered entrance */}
            {displaySubtitle && (
              <p
                className="text-white/80 text-lg md:text-xl max-w-xl mb-8 md:mb-10"
                style={{
                  animation: `fadeInUp 0.8s ease-out ${subtitleDelay} both`,
                }}
              >
                {displaySubtitle}
              </p>
            )}

            {/* CTA - staggered entrance */}
            <Link
              to={ctaUrl}
              className={cn(
                'inline-block px-8 md:px-12 py-3 md:py-4',
                'border border-white text-white font-medium tracking-wide',
                'hover:bg-white hover:text-black transition-all duration-300',
                'opacity-0 animate-fade-in-up'
              )}
              style={{
                animationDelay: ctaDelay,
                animationFillMode: 'forwards',
              }}
            >
              {displayCtaLabel || (lang === 'en' ? 'Shop Now' : 'Mua ngay')}
            </Link>
          </div>
        </div>
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
