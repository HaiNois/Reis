import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { cn } from '@/lib/utils'
import type { HomepageSection } from '@/services/homepageApi'

// Resolve the best available image URL for a CATEGORY_SHOWCASE item.
// Priority: admin-supplied mediaUrl → backend-injected previewImage → placeholder.
function resolveItemImage(item: {
  mediaUrl?: string | null
  previewImage?: string | null
}): string {
  return item.mediaUrl || item.previewImage || '/images/products/placeholder.jpg'
}

// Resolve the storefront link for a showcase item.
// Uses category slug to build /products?category=<slug>; falls back to ctaUrl then /products.
function resolveItemLink(item: {
  ctaUrl?: string | null
  category?: { slug: string } | null
}): string {
  if (item.category?.slug) return `/products?category=${item.category.slug}`
  return item.ctaUrl || '/products'
}

// Single showcase card — editorial aspect ratio, no overlay, no border, hover scale
function ShowcaseCard({
  item,
  lang,
  index,
}: {
  item: NonNullable<HomepageSection['items']>[number]
  lang: string
  index: number
}) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()

  const image = resolveItemImage(item)
  const link = resolveItemLink(item)

  // i18n field mapping per plan:
  //   title (DB)    = eyebrow VI
  //   subtitle (DB) = eyebrow EN
  //   description   = title override VI
  //   metaJson.titleEn = title override EN
  //   metaJson.ctaLabelEn = CTA label EN
  //   category.name / category.nameEn = fallback title when description is empty
  const meta = (item.metaJson ?? {}) as Record<string, string>
  const categoryNameVi = item.category?.name ?? ''
  const categoryNameEn = item.category?.nameEn ?? categoryNameVi

  const eyebrow = lang === 'en' ? (item.subtitle ?? item.title ?? '') : (item.title ?? '')
  const title = lang === 'en'
    ? (meta.titleEn ?? item.description ?? categoryNameEn)
    : (item.description ?? categoryNameVi)
  const ctaLabel = lang === 'en'
    ? (meta.ctaLabelEn ?? item.ctaLabel ?? 'Shop Now')
    : (item.ctaLabel ?? 'Xem ngay')

  return (
    <div
      ref={ref}
      className={cn(
        'group transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Image — no overlay, pure editorial */}
      <Link to={link} className="block overflow-hidden aspect-[4/5] md:aspect-[3/4]">
        <img
          src={image}
          alt={title || eyebrow || ''}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </Link>

      {/* Text block */}
      <div className="pt-4 pb-2">
        {eyebrow && (
          <p className="text-xs font-serif italic text-gray-500 mb-1 tracking-wide">
            {eyebrow}
          </p>
        )}

        {title && (
          <h3 className="text-base md:text-lg font-light text-gray-900 mb-3 leading-snug">
            {title}
          </h3>
        )}

        <Link
          to={link}
          className="inline-block text-xs font-medium uppercase tracking-[0.2em] text-gray-900 underline underline-offset-4 hover:text-gray-600 transition-colors duration-300"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}

// ==================== CATEGORY SHOWCASE SECTION ====================
// Editorial grid: N columns responsive, no overlay, no card border, hover scale only.
// Renders only items that are active and either have a collection or a mediaUrl.

export default function CategoryShowcaseSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'

  const items = (section.items ?? []).filter(
    (it) => it.isActive && (it.category || it.mediaUrl || it.previewImage),
  )

  if (items.length === 0) return null

  // Section header — optional, only shown when title is set
  const sectionTitle = section.title
  const sectionSubtitle = section.subtitle

  return (
    <section className="py-12 md:py-20">
      <div className="container-custom">
        {/* Header */}
        {(sectionTitle || sectionSubtitle) && (
          <div className="mb-10 md:mb-14 text-center">
            {sectionSubtitle && (
              <p className="text-xs font-serif italic text-gray-500 mb-2 tracking-wide">
                {sectionSubtitle}
              </p>
            )}
            {sectionTitle && (
              <h2 className="text-2xl md:text-3xl font-light text-gray-900 tracking-wide">
                {sectionTitle}
              </h2>
            )}
          </div>
        )}

        {/* Responsive grid: 2 cols on mobile, 3 on md, 4 on lg (max 4 items per row) */}
        <div
          className={cn(
            'grid gap-6 md:gap-8',
            items.length === 1 && 'grid-cols-1 max-w-sm mx-auto',
            items.length === 2 && 'grid-cols-2',
            items.length === 3 && 'grid-cols-2 md:grid-cols-3',
            items.length >= 4 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
          )}
        >
          {items.map((item, index) => (
            <ShowcaseCard
              key={item.id}
              item={item}
              lang={lang}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
