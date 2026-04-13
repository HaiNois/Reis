import { useTranslation } from 'react-i18next'
import { useInView } from '@/hooks/useInView'
import { SectionHeader } from './SectionHeader'
import { CollectionCard } from './CollectionCard'
import { cn } from '@/lib/utils'

interface CollectionItem {
  id: string
  slug: string
  name: string
  nameEn?: string
  imageUrl: string
  mobileImageUrl?: string
  size?: 'large' | 'medium' | 'small' | 'full-width'
  subtitle?: string
  subtitleEn?: string
}

interface CollectionsSectionProps {
  title?: string
  titleEn?: string
  subtitle?: string
  subtitleEn?: string
  collections: CollectionItem[]
  gridLayout?: 'asymmetric' | 'equal'
}

export function CollectionsSection({
  title,
  titleEn,
  subtitle,
  subtitleEn,
  collections,
  gridLayout = 'asymmetric',
}: CollectionsSectionProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 })

  const displayTitle = lang === 'en' && titleEn ? titleEn : title
  const displaySubtitle = lang === 'en' && subtitleEn ? subtitleEn : subtitle

  if (!collections?.length) return null

  // Assign sizes based on layout
  const getLayoutSizes = () => {
    if (gridLayout === 'equal') {
      return collections.map(() => 'medium' as const)
    }

    // Asymmetric layout: large, small, medium, full-width pattern
    const sizes: Array<'large' | 'medium' | 'small' | 'full-width'> = []
    collections.forEach((_, index) => {
      switch (index % 4) {
        case 0:
          sizes.push('large')
          break
        case 1:
          sizes.push('small')
          break
        case 2:
          sizes.push('medium')
          break
        case 3:
          sizes.push('full-width')
          break
      }
    })
    return sizes
  }

  const sizes = getLayoutSizes()

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container-custom">
        {/* Header */}
        <SectionHeader
          title={displayTitle || (lang === 'en' ? 'Collections' : 'Bộ Sưu Tập')}
          subtitle={displaySubtitle}
          alignment="left"
        />

        {/* Asymmetric Grid */}
        <div
          ref={ref}
          className={cn(
            'grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6',
            'transition-all duration-700',
            isInView ? 'opacity-100' : 'opacity-0'
          )}
        >
          {collections.map((collection, index) => (
            <CollectionCard
              key={collection.id}
              {...collection}
              size={sizes[index] || 'medium'}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
