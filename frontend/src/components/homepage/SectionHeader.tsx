import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title?: string
  titleEn?: string
  subtitle?: string
  subtitleEn?: string
  viewAllUrl?: string
  viewAllLabel?: string
  alignment?: 'left' | 'center' | 'right'
  className?: string
}

export function SectionHeader({
  title,
  titleEn,
  subtitle,
  subtitleEn,
  viewAllUrl,
  viewAllLabel,
  alignment = 'left',
  className,
}: SectionHeaderProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.2 })

  const displayTitle = lang === 'en' && titleEn ? titleEn : title
  const displaySubtitle = lang === 'en' && subtitleEn ? subtitleEn : subtitle

  const alignmentClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-4 mb-12',
        alignmentClasses[alignment],
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        'transition-all duration-700 ease-out',
        className
      )}
    >
      {displaySubtitle && (
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500 font-medium">
          {displaySubtitle}
        </p>
      )}
      {displayTitle && (
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-wide">
          {displayTitle}
        </h2>
      )}
      {viewAllUrl && (
        <Link
          to={viewAllUrl}
          className="inline-flex items-center gap-2 text-sm font-medium tracking-wide hover:text-gray-600 transition-colors group"
        >
          <span>{viewAllLabel || (lang === 'en' ? 'View all' : 'Xem tất cả')}</span>
          <span className="transform group-hover:translate-x-1 transition-transform duration-300">
            →
          </span>
        </Link>
      )}
    </div>
  )
}
