import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInView, getStaggerDelay } from '@/hooks/useInView'
import { cn } from '@/lib/utils'

interface CollectionCardProps {
  slug: string
  name: string
  nameEn?: string
  imageUrl: string
  mobileImageUrl?: string
  size?: 'large' | 'medium' | 'small' | 'full-width'
  subtitle?: string
  subtitleEn?: string
  index?: number
}

export function CollectionCard({
  slug,
  name,
  nameEn,
  imageUrl,
  mobileImageUrl,
  size = 'medium',
  subtitle,
  subtitleEn,
  index = 0,
}: CollectionCardProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.15 })

  const displayName = lang === 'en' && nameEn ? nameEn : name
  const displaySubtitle = lang === 'en' && subtitleEn ? subtitleEn : subtitle

  // Size-based aspect ratios per spec:
  // Large (4:5), Small (3:4), Full-width (21:9)
  const aspectRatios = {
    large: 'aspect-[4/5]',
    medium: 'aspect-[3/4]',
    small: 'aspect-[3/4]',
    'full-width': 'aspect-[21/9]',
  }

  // Asymmetric 12-column grid per spec:
  // Large card: col-span-7, Small cards: col-span-5, Full-width: col-span-12
  const gridSpans = {
    large: 'md:col-span-7',
    medium: 'md:col-span-5',
    small: 'md:col-span-5',
    'full-width': 'md:col-span-12',
  }

  const staggerStyle = getStaggerDelay(index, 100)

  return (
    <div
      ref={ref}
      className={cn(
        'group relative overflow-hidden',
        aspectRatios[size],
        gridSpans[size],
        'transition-all duration-700',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      )}
      style={staggerStyle}
    >
      <Link to={`/collections/${slug}`} className="block w-full h-full">
        {/* Image */}
        <div className="relative w-full h-full overflow-hidden">
          <picture>
            <source media="(max-width: 768px)" srcSet={mobileImageUrl || imageUrl} />
            <img
              src={imageUrl}
              alt={displayName}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </picture>

          {/* Overlay gradient - editorial style */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Content */}
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            {/* Arrow indicator */}
            <span className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
              <svg
                className="w-5 h-5 text-white"
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

            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              {displaySubtitle && (
                <p className="text-white/70 text-sm uppercase tracking-[0.2em] mb-2">
                  {displaySubtitle}
                </p>
              )}
              <h3 className="text-white text-xl md:text-2xl font-display font-bold tracking-wide">
                {displayName}
              </h3>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
