import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'
import { FALLBACK_IMAGE } from '@/services/productApi'

interface ProductCardProps {
  slug: string
  name: string
  nameEn?: string
  price: number
  images: string[]
  isNew?: boolean
  isSale?: boolean
  salePrice?: number
  className?: string
}

export function ProductCard({
  slug,
  name,
  nameEn,
  price,
  images,
  isNew,
  isSale,
  salePrice,
  className,
}: ProductCardProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1 })

  const displayName = lang === 'en' && nameEn ? nameEn : name
  const mainImage = images?.[0] || FALLBACK_IMAGE
  const hasMultipleImages = images?.length > 1

  const formatPrice = (p: number) => p.toLocaleString('vi-VN')

  return (
    <div
      ref={ref}
      className={cn(
        'group block transition-all duration-500',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {/* Image container */}
      <Link to={`/products/${slug}`} className="block relative">
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
          {/* Main image */}
          <img
            src={mainImage}
            alt={displayName}
            className={cn(
              'w-full h-full object-cover transition-transform duration-700',
              hasMultipleImages ? 'group-hover:opacity-0' : 'group-hover:scale-105'
            )}
            loading="lazy"
          />

          {/* Secondary image (hover) */}
          {hasMultipleImages && (
            <img
              src={images[1] || mainImage}
              alt={`${displayName} alternate`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              loading="lazy"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isNew && (
              <span className="px-2 py-1 bg-black text-white text-xs font-medium tracking-wide">
                {lang === 'en' ? 'NEW' : 'MỚI'}
              </span>
            )}
            {isSale && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium tracking-wide">
                {lang === 'en' ? 'SALE' : 'GIẢM GIÁ'}
              </span>
            )}
          </div>

          {/* Quick view overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100">
            <span className="px-6 py-2 bg-white/95 text-black text-sm font-medium tracking-wide transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              {lang === 'en' ? 'Quick View' : 'Xem nhanh'}
            </span>
          </div>
        </div>
      </Link>

      {/* Product info */}
      <Link to={`/products/${slug}`} className="block mt-4">
        <h3 className="text-sm md:text-base font-medium tracking-wide text-gray-900 line-clamp-2">
          {displayName}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className={cn('font-medium', isSale && 'text-red-500')}>
            {formatPrice(isSale && salePrice ? salePrice : price)} ₫
          </span>
          {isSale && salePrice && (
            <span className="text-gray-400 line-through text-sm">
              {formatPrice(price)} ₫
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
