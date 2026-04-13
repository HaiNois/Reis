import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import {
  homepageSectionApi,
  feedbackApi,
  HomepageSection,
  ProductImage as HomepageProductImage,
} from '@/services/homepageApi'
import { collectionApi, FALLBACK_IMAGE, buildPublicUrl } from '@/services/productApi'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import AutoPlay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { useScaleParallax } from '@/hooks/useParallax'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useProductVariants } from '@/hooks/useProductVariants'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ==================== HELPER FUNCTIONS ====================

function getProductImageUrl(images: HomepageProductImage[] | undefined, fallbackImage?: string | null): string {
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
      return fallbackImage || FALLBACK_IMAGE
    } catch {
      return images || fallbackImage || FALLBACK_IMAGE
    }
  }

  if (!images || images.length === 0) {
    if (fallbackImage && typeof fallbackImage === 'string') {
      try {
        const parsed = JSON.parse(fallbackImage)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
      } catch {}
    }
    return fallbackImage || FALLBACK_IMAGE
  }

  if (typeof images[0] === 'object' && 'url' in images[0]) {
    return (images as { url: string }[])[0]?.url || fallbackImage || FALLBACK_IMAGE
  }

  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return a.sortOrder - b.sortOrder
  })
  const mainImage = sorted[0]

  if (mainImage?.publicUrl) return mainImage.publicUrl
  if (mainImage?.url) return mainImage.url
  if (mainImage?.objectKey) return buildPublicUrl(mainImage.objectKey)
  return fallbackImage || FALLBACK_IMAGE
}

function getProductImages(images: HomepageProductImage[] | undefined, fallbackImage?: string | null): string[] {
  if (fallbackImage && typeof fallbackImage === 'string') {
    if (fallbackImage.startsWith('[')) {
      try {
        const parsed = JSON.parse(fallbackImage)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((url: string) => url)
        }
      } catch {}
    }
    if (fallbackImage.startsWith('http')) {
      return [fallbackImage]
    }
  }

  if (images && typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((url: string) => url)
      }
    } catch {}
  }

  if (images && images.length > 0 && typeof images[0] === 'object' && 'url' in images[0]) {
    const urls = (images as { url: string }[]).map(img => img.url).filter(Boolean)
    return urls.length > 0 ? urls : [FALLBACK_IMAGE]
  }

  return [FALLBACK_IMAGE]
}

// Sub-carousel component using embla directly
function SubCarousel({
  images,
  productSlug,
  productName,
}: {
  images: string[]
  productSlug: string
  productName?: string
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <div className="relative w-full h-full group/subcarousel">
      <div ref={emblaRef} className="w-full h-full overflow-hidden">
        <div className="flex h-full">
          {images.map((imgUrl, idx) => (
            <div key={idx} className="flex-none h-full w-full">
              <Link
                to={`/products/${productSlug}`}
                className="block w-full h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={imgUrl}
                  alt={`${productName} ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
      {/* Navigation buttons - show on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          scrollPrev()
        }}
        className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/70 hover:bg-white/90 z-20 flex items-center justify-center opacity-0 group-hover/subcarousel:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          scrollNext()
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/70 hover:bg-white/90 z-20 flex items-center justify-center opacity-0 group-hover/subcarousel:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ==================== SECTION RENDERERS ====================

// Announcement Bar
function AnnouncementBarSection({ section }: { section: HomepageSection }) {
  const title = section.title
  const ctaUrl = section.items?.[0]?.ctaUrl || '#'
  const linkTarget = section.items?.[0]?.linkTarget === 'BLANK' ? '_blank' : '_self'

  if (!title) return null

  return (
    <div className="bg-black text-white text-center py-2 overflow-hidden">
      <div className="flex justify-center items-center gap-4">
        <Link
          to={ctaUrl}
          target={linkTarget}
          className="hover:opacity-80 transition-opacity text-sm"
        >
          {title}
        </Link>
      </div>
    </div>
  )
}

// Hero Section - IMPROVED: Full viewport, staggered entrance, scroll indicator
function HeroSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const title = section.title
  const subtitle = section.subtitle
  const config = section.configJson as
    | { overlayStyle?: string; textAlign?: string }
    | undefined
  const scale = useScaleParallax({ minScale: 1, maxScale: 1.05, maxScroll: 500 })
  const [scrollY, setScrollY] = useState(0)

  const heroItem = section.items?.[0]
  const imageUrl = heroItem?.mediaUrl || '/images/banners/banner.jpg'
  const mobileImageUrl = heroItem?.mobileMediaUrl || imageUrl
  const ctaLabel =
    heroItem?.ctaLabel || (lang === 'en' ? 'Shop Now' : 'Mua ngay')
  const ctaUrl = heroItem?.ctaUrl || '/products'

  const textAlign = config?.textAlign || 'center'

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const eyebrowDelay = '0ms'
  const titleDelay = '150ms'
  const ctaDelay = '450ms'

  const textPositionClasses = {
    center: 'items-center text-center',
    left: 'items-start text-left',
    right: 'items-end text-right',
  }

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <section className="relative bg-gray-100 overflow-hidden">
      <div
        className="relative w-full will-change-transform min-h-[80vh] md:min-h-screen"
        style={{
          transform: `translateY(${scrollY * 0.3}px) scale(${scale})`,
        }}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet={mobileImageUrl} />
          <img
            src={imageUrl}
            alt={title || 'Hero'}
            className="w-full h-full object-cover"
          />
        </picture>

        {/* Gradient overlay: editorial dark-to-transparent */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Content with staggered entrance */}
        <div className={cn(
          'absolute inset-0 flex flex-col justify-center',
          textPositionClasses[textAlign as keyof typeof textPositionClasses] || textPositionClasses.center
        )}>
          <div className="container-custom">
            {/* Eyebrow */}
            {subtitle && (
              <p
                className="text-white/80 uppercase tracking-[0.2em] text-sm md:text-base mb-4 md:mb-6"
                style={{
                  animation: `fadeInUp 0.8s ease-out ${eyebrowDelay} both`,
                }}
              >
                {subtitle}
              </p>
            )}

            {/* Title */}
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-wide text-white mb-4 md:mb-6"
              style={{
                animation: `fadeInUp 0.8s ease-out ${titleDelay} both`,
              }}
            >
              {title}
            </h1>

            {/* CTA */}
            <Link
              to={ctaUrl}
              className="inline-block px-8 md:px-12 py-3 md:py-4 border border-white text-white font-medium tracking-wide hover:bg-white hover:text-black transition-all duration-300"
              style={{
                animation: `fadeInUp 0.8s ease-out ${ctaDelay} both`,
              }}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>

        {/* Scroll indicator - animated bounce */}
        <button
          onClick={handleScrollDown}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors cursor-pointer"
          style={{
            animation: `fadeInUp 0.8s ease-out 600ms both, bounce 2s ease-in-out 1s infinite`,
          }}
          aria-label={lang === 'en' ? 'Scroll down' : 'Cuộn xuống'}
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>

      {/* Keyframes */}
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
        @keyframes bounce {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(8px);
          }
        }
      `}</style>
    </section>
  )
}

// Product Rail - Enhanced with sizes on hover
function ProductRailSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const title = section.title
  const subtitle = section.subtitle

  const products = section.products?.map((sp) => sp.product || sp) || []
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section className="py-8 md:py-12 border-t">
      <div className="container-custom">
        {/* Header */}
        <div
          ref={headerRef}
          className={cn(
            'flex items-center justify-between mb-12 transition-all duration-700',
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide">
              {title || (lang === 'en' ? 'Products' : 'Sản phẩm')}
            </h2>
            {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
          </div>
          <Link
            to="/products"
            className="text-sm font-medium tracking-wide hover:text-gray-600 transition-colors"
          >
            {lang === 'en' ? 'View all products' : 'Xem tất cả Product'}
          </Link>
        </div>

        {/* Carousel with AutoPlay */}
        <div>
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            plugins={[
              AutoPlay({
                delay: 3000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {products.filter(Boolean).map((product, index) => {
                const productImages = getProductImages(product?.images, (product as any)?.image)
                const showSubCarousel = productImages.length > 1
                const originalPrice = (product as any)?.originalPrice
                const isNew = (product as any)?.isNew || false

                return (
                  <CarouselItem
                    key={product.id}
                    className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                  >
                    <ProductCardItem
                      product={product}
                      productImages={productImages}
                      showSubCarousel={showSubCarousel}
                      lang={lang}
                      index={index}
                      isNew={isNew}
                      originalPrice={originalPrice}
                    />
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  )
}

// Product Card Item - Enhanced with scroll reveal, improved hover and Quick Add
function ProductCardItem({
  product,
  productImages,
  showSubCarousel,
  lang,
  index,
  isNew,
  originalPrice,
}: {
  product: any
  productImages: string[]
  showSubCarousel: boolean
  lang: string
  index: number
  isNew?: boolean
  originalPrice?: number
}) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()
  const { sizes, loading } = useProductVariants(product?.slug)

  return (
    <div
      ref={ref}
      className={cn(
        'product-card group block transition-all duration-500',
        'hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 75}ms`, transitionProperty: 'opacity, transform, shadow' }}
    >
      {/* Image container with sub-carousel */}
      <div className="product-card__image aspect-[3/4] overflow-hidden relative rounded-sm">
        {/* New badge */}
        {isNew && (
          <span className="absolute top-3 left-3 z-10 bg-black text-white text-xs px-2 py-1 uppercase tracking-wider">
            {lang === 'en' ? 'New' : 'Mới'}
          </span>
        )}

        {showSubCarousel ? (
          <SubCarousel
            images={productImages}
            productSlug={product?.slug || ''}
            productName={lang === 'en' && product?.nameEn ? product.nameEn : product?.name}
          />
        ) : (
          <Link to={`/products/${product?.slug}`} className="block w-full h-full">
            <img
              src={productImages[0]}
              alt={lang === 'en' && product?.nameEn ? product.nameEn : product?.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </Link>
        )}

        {/* Sizes overlay - appears on hover at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          {loading ? (
            <div className="flex items-center justify-center gap-1">
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            </div>
          ) : sizes.length > 0 ? (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {sizes.map((size) => (
                <Link
                  key={size}
                  to={`/products/${product?.slug}?size=${size}`}
                  className="px-2 py-1 bg-white/90 hover:bg-white text-black text-xs font-medium rounded transition-colors"
                >
                  {size}
                </Link>
              ))}
            </div>
          ) : (
            <Link
              to={`/products/${product?.slug}`}
              className="block text-center text-white text-xs hover:underline"
            >
              {lang === 'en' ? 'View options' : 'Xem tùy chọn'}
            </Link>
          )}
        </div>
      </div>

      <Link to={`/products/${product?.slug}`} className="product-card__info block pt-3">
        <h3 className="product-card__title text-sm md:text-base font-medium group-hover:text-gray-600 transition-colors duration-300 line-clamp-1">
          {lang === 'en' && product?.nameEn
            ? product.nameEn
            : product?.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <p className={cn(
            'product-card__price font-medium',
            originalPrice && 'text-red-600'
          )}>
            {Number(product?.price).toLocaleString('vi-VN')} ₫
          </p>
          {originalPrice && originalPrice > product?.price && (
            <p className="product-card__original text-gray-400 text-sm line-through">
              {Number(originalPrice).toLocaleString('vi-VN')} ₫
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}

// Media Tiles - IMPROVED: Enhanced hover effects and animations
function MediaTilesSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const title = section.title
  const config = section.configJson as { collectionIds?: string[]; collectionId?: string } | undefined
  const collectionIds = config?.collectionIds || (config?.collectionId ? [config.collectionId] : [])

  const items = section.items?.filter((i: any) => i.type === 'MEDIA_TILE' || i.type === 'COLLECTION') || []
  const [collectionProducts, setCollectionProducts] = useState<any[]>([])

  useEffect(() => {
    if (collectionIds.length > 0) {
      collectionApi.getCollectionProducts(collectionIds[0]).then((res: any) => {
        setCollectionProducts(res.data || [])
      }).catch(() => setCollectionProducts([]))
    }
  }, [collectionIds])

  const displayProducts = collectionProducts.length > 0 ? collectionProducts : []

  return (
    <section className="py-8 md:py-12">
      <div className="container-custom">
        {displayProducts.length > 0 ? (
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            plugins={[
              AutoPlay({
                delay: 5000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full"
          >
            {title && (
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide">
                  {title}
                </h2>
              </div>
            )}
            <CarouselContent className="-ml-4">
              {displayProducts.map((product: any, index: number) => (
                <CarouselItem
                  key={product.id}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <MediaProductCard product={product} lang={lang} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white/100 shadow-md border-0" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white/100 shadow-md border-0" />
          </Carousel>
        ) : items.length > 0 ? (
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            plugins={[
              AutoPlay({
                delay: 5000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full"
          >
            {title && (
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide">
                  {title}
                </h2>
              </div>
            )}
            <CarouselContent className="-ml-4">
              {items.map((item: any) => (
                <CarouselItem
                  key={item.id}
                  className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <Link
                    to={item.ctaUrl || '#'}
                    target={item.linkTarget === 'BLANK' ? '_blank' : '_self'}
                    className="media-tile group relative block overflow-hidden aspect-[4/5] rounded-sm"
                  >
                    {/* Image with enhanced zoom */}
                    <img
                      src={item.image || item.mediaUrl || '/images/products/placeholder.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Enhanced overlay with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                    {/* Content with slide-up animation */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      {item.title && (
                        <h3 className="text-white text-xl font-bold translate-y-0 group-hover:translate-y-0 transition-transform duration-300">
                          {item.title}
                        </h3>
                      )}
                      {item.subtitle && (
                        <p className="text-white/80 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                          {item.subtitle}
                        </p>
                      )}
                      {item.cta && (
                        <span className="text-white text-sm mt-3 underline opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                          {item.cta}
                        </span>
                      )}
                    </div>

                    {/* Border highlight on hover */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 transition-colors duration-300 rounded-sm" />
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : null}
      </div>
    </section>
  )
}

// Media Product Card - Enhanced card for collection products
function MediaProductCard({ product, lang, index }: { product: any; lang: string; index: number }) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={cn(
        'product-card group block transition-all duration-500',
        'hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 75}ms`, transitionProperty: 'opacity, transform, shadow' }}
    >
      <Link to={`/products/${product.slug}`} className="block">
        <div className="product-card__image aspect-[3/4] overflow-hidden relative rounded-sm">
          <img
            src={getProductImageUrl(product.images)}
            alt={lang === 'en' && product.nameEn ? product.nameEn : product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>
        <div className="product-card__info pt-3">
          <h3 className="product-card__title text-sm md:text-base font-medium group-hover:text-gray-600 transition-colors duration-300 line-clamp-1">
            {lang === 'en' && product.nameEn ? product.nameEn : product.name}
          </h3>
          <p className="product-card__price font-medium mt-1">
            {Number(product.price).toLocaleString('vi-VN')} ₫
          </p>
        </div>
      </Link>
    </div>
  )
}

// Section Renderer
function SectionRenderer({ section }: { section: HomepageSection }) {
  switch (section.sectionType) {
    case 'ANNOUNCEMENT_BAR':
      return <AnnouncementBarSection key={section.id} section={section} />
    case 'HERO':
      return <HeroSection key={section.id} section={section} />
    case 'PRODUCT_RAIL':
      return <ProductRailSection key={section.id} section={section} />
    case 'MEDIA_TILES':
      return <MediaTilesSection key={section.id} section={section} />
    default:
      return null
  }
}

// ==================== FEEDBACK SECTION ====================

function FeedbackSection({ feedback }: { feedback: any[] }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'

  return (
    <section className="py-8 md:py-12 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-2xl md:text-3xl font-display font-bold tracking-wide text-center mb-12">
          {lang === 'en' ? 'Customer Reviews' : 'Đánh Giá Khách Hàng'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feedback.map((fb: any) => (
            <div
              key={fb.id}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {fb.avatarUrl ? (
                    <img
                      src={fb.avatarUrl}
                      alt={fb.customerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-500">
                      {fb.customerName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{fb.customerName}</h4>
                  {fb.customerRole && (
                    <p className="text-sm text-gray-500">{fb.customerRole}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={cn('w-4 h-4', star <= fb.rating ? 'text-yellow-400' : 'text-gray-200')}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600">{fb.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ==================== BANNER SECTION - IMPROVED ====================

function StaticBannerSection() {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const [leftScroll, setLeftScroll] = useState(0)

  useEffect(() => {
    const handleScroll = () => setLeftScroll(window.scrollY * 0.2)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container-custom">
        {/* Split layout: Left 60% + Right 40% stacked */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Left large banner - col-span-7 (60%) */}
          <Link
            to="/collections"
            className="relative md:col-span-7 overflow-hidden rounded-lg h-[50vh] md:h-[70vh] group"
          >
            <div
              className="relative w-full h-full overflow-hidden will-change-transform"
              style={{ transform: `translateY(${leftScroll * 0.1}px)` }}
            >
              <img
                src="/images/products/621561089_17959227669044199_2769149982932536652_n.jpg"
                alt={lang === 'en' ? 'Women Collection' : 'Bộ Sưu Tập Nữ'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <p className="text-white/80 text-sm uppercase tracking-[0.2em] mb-2">
                {lang === 'en' ? 'New Arrivals' : 'Hàng Mới Về'}
              </p>
              <h3 className="text-white text-2xl md:text-3xl lg:text-4xl font-display font-bold tracking-wide mb-4 md:mb-6">
                {lang === 'en' ? 'Women Collection' : 'Bộ Sưu Tập Nữ'}
              </h3>

              {/* Ghost CTA with arrow animation */}
              <span className="inline-flex items-center gap-3 px-6 py-3 border border-white text-white text-sm font-medium tracking-wide hover:bg-white hover:text-black transition-all duration-300 group/cta">
                {lang === 'en' ? 'Shop Now' : 'Mua ngay'}
                <svg
                  className="w-4 h-4 transform group-hover/cta:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </div>
          </Link>

          {/* Right stacked banners - col-span-5 (40%) */}
          <div className="relative md:col-span-5 flex flex-col gap-4 md:gap-6">
            {/* Accessories */}
            <Link
              to="/collections"
              className="relative flex-1 overflow-hidden rounded-lg h-[24vh] md:h-[34vh] group"
            >
              <div
                className="relative w-full h-full overflow-hidden will-change-transform"
                style={{ transform: `translateY(${leftScroll * 0.05}px)` }}
              >
                <img
                  src="/images/products/621788664_17959227642044199_6141261247981617575_n.jpg"
                  alt={lang === 'en' ? 'Accessories' : 'Phụ Kiện'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <p className="text-white/70 text-xs uppercase tracking-[0.15em] mb-1">
                  {lang === 'en' ? 'Accessories' : 'Phụ Kiện'}
                </p>
                <h3 className="text-white text-lg md:text-xl font-display font-bold tracking-wide">
                  {lang === 'en' ? 'Accessorize' : 'Phụ Kiện'}
                </h3>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </Link>

            {/* View All */}
            <Link
              to="/products"
              className="relative flex-1 overflow-hidden rounded-lg h-[24vh] md:h-[34vh] group bg-black flex items-center justify-center"
            >
              <div className="text-center p-6">
                <h3 className="text-white text-xl md:text-2xl font-display font-bold tracking-wide mb-3">
                  {lang === 'en' ? 'Explore All' : 'Khám Phá Tất Cả'}
                </h3>

                {/* Ghost button with arrow animation */}
                <span className="inline-flex items-center gap-2 px-6 py-3 border border-white text-white text-sm font-medium tracking-wide hover:bg-white hover:text-black transition-all duration-300 group/cta">
                  {lang === 'en' ? 'View All' : 'Xem Tất Cả'}
                  <svg
                    className="w-4 h-4 transform group-hover/cta:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>

              {/* Hover scale effect */}
              <div className="absolute inset-0 scale-100 group-hover:scale-105 transition-transform duration-700" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ==================== MAIN HOMEPAGE ====================

export default function Homepage() {
  const [loading, setLoading] = useState(true)
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([])
  const [feedback, setFeedback] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsRes, feedbackRes] = await Promise.all([
          homepageSectionApi.getActiveHomepage().catch(() => ({ data: [] })),
          feedbackApi.getFeaturedFeedback().catch(() => ({ data: [] })),
        ])

        setHomepageSections(sectionsRes.data || [])
        setFeedback(feedbackRes.data || [])
      } catch (error) {
        console.error('Failed to fetch homepage data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div>
      {/* Dynamic Homepage Sections */}
      {homepageSections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}

      {/* Feedback */}
      {feedback.length > 0 && <FeedbackSection feedback={feedback} />}

      {/* Static Banner Section */}
      <StaticBannerSection />
    </div>
  )
}
