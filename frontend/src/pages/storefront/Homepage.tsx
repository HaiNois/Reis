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
import { useScrollYRaf } from '@/hooks/useScrollYRaf'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import CategoryShowcaseSection from '@/components/homepage/category-showcase-section'
import EmptyHomepage from '@/components/homepage/EmptyHomepage'

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

// Announcement Bar (Phase 2)
/* function AnnouncementBarSection({ section }: { section: HomepageSection }) {
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
} */

// Hero Section - parallax via RAF hook + accessibility (prefers-reduced-motion)
function HeroSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const title = section.title
  const subtitle = section.subtitle
  const config = section.configJson as
    | { overlayStyle?: string; textAlign?: string }
    | undefined

  // Use shared RAF-throttled scrollY — no duplicate event listeners
  const scrollY = useScrollYRaf()
  const prefersReducedMotion = usePrefersReducedMotion()
  const scale = useScaleParallax({ minScale: 1, maxScale: 1.05, maxScroll: 500 })

  const heroItem = section.items?.[0]
  const imageUrl = heroItem?.mediaUrl || '/images/banners/banner.jpg'
  const mobileImageUrl = heroItem?.mobileMediaUrl || imageUrl
  const ctaLabel =
    heroItem?.ctaLabel || (lang === 'en' ? 'Shop Now' : 'Mua ngay')
  const ctaUrl = heroItem?.ctaUrl || '/products'

  const textAlign = config?.textAlign || 'center'

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
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  // Parallax transform: disabled when user prefers reduced motion
  const parallaxStyle = prefersReducedMotion
    ? {}
    : {
        transform: `translateY(${scrollY * 0.3}px) scale(${scale})`,
      }

  return (
    <section className="relative bg-gray-100 overflow-hidden">
      <div
        className="relative w-full will-change-transform min-h-[80vh] md:min-h-screen"
        style={parallaxStyle}
      >
        <picture>
          <source media="(max-width: 768px)" srcSet={mobileImageUrl} />
          {/* fetchPriority + eager loading for LCP optimisation */}
          <img
            src={imageUrl}
            alt={title || 'Hero'}
            className="w-full h-full object-cover"
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
        </picture>

        {/* Gradient overlay: reduced opacity — preserves background tone while keeping text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

        {/* Content with staggered entrance */}
        <div className={cn(
          'absolute inset-0 flex flex-col justify-center',
          textPositionClasses[textAlign as keyof typeof textPositionClasses] || textPositionClasses.center
        )}>
          <div className="container-custom">
            {/* Eyebrow — italic tracking uppercase */}
            {subtitle && (
              <p
                className="text-white/80 italic uppercase tracking-[0.2em] text-sm md:text-base mb-4 md:mb-6 font-serif"
                style={{
                  animation: `fadeInUp 0.8s ease-out ${eyebrowDelay} both`,
                }}
              >
                {subtitle}
              </p>
            )}

            {/* Title — serif light, larger */}
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-serif font-light tracking-wide text-white mb-4 md:mb-6"
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

        {/* Scroll indicator - animated bounce (disabled when prefers-reduced-motion) */}
        <button
          onClick={handleScrollDown}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors cursor-pointer"
          style={
            prefersReducedMotion
              ? { animation: `fadeInUp 0.8s ease-out 600ms both` }
              : { animation: `fadeInUp 0.8s ease-out 600ms both, bounce 2s ease-in-out 1s infinite` }
          }
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

// Product Rail - Enhanced heading hierarchy: eyebrow + serif light h2
function ProductRailSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const title = section.title
  const subtitle = section.subtitle

  const products = section.products?.map((sp) => sp.product || sp) || []
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>()

  return (
    // id for deep-linking from admin CMS: /products#section-{slug}
    <section id={`section-${section.slug}`} className="py-8 md:py-12">
      <div className="container-custom">
        {/* Header */}
        <div
          ref={headerRef}
          className={cn(
            'flex items-end justify-between mb-12 transition-all duration-700',
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <div>
            {/* Eyebrow: subtitle rendered as italic tracking label above heading */}
            {subtitle && (
              <p className="text-gray-500 italic uppercase tracking-[0.2em] text-xs md:text-sm mb-2 font-serif">
                {subtitle}
              </p>
            )}
            {/* Heading: serif light for editorial differentiation */}
            <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide">
              {title || (lang === 'en' ? 'Products' : 'Sản phẩm')}
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-medium tracking-wide hover:text-gray-600 transition-colors shrink-0 mb-1"
          >
            {lang === 'en' ? 'View all products' : 'Xem tất cả'}
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

// Media Tiles - heading hierarchy: eyebrow + serif light h2
function MediaTilesSection({ section }: { section: HomepageSection }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const title = section.title
  const subtitle = section.subtitle
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

  // Shared heading block for the section
  const SectionHeading = title ? (
    <div className="flex items-end justify-between mb-12">
      <div>
        {subtitle && (
          <p className="text-gray-500 italic uppercase tracking-[0.2em] text-xs md:text-sm mb-2 font-serif">
            {subtitle}
          </p>
        )}
        <h2 className="text-3xl md:text-4xl font-serif font-light tracking-wide">{title}</h2>
      </div>
    </div>
  ) : null

  return (
    // id for deep-linking from admin CMS
    <section id={`section-${section.slug}`} className="py-8 md:py-12">
      <div className="container-custom">
        {displayProducts.length > 0 ? (
          <Carousel
            opts={{ align: 'start', loop: true }}
            plugins={[AutoPlay({ delay: 5000, stopOnInteraction: false })]}
            className="w-full"
          >
            {SectionHeading}
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
            opts={{ align: 'start', loop: true }}
            plugins={[AutoPlay({ delay: 5000, stopOnInteraction: false })]}
            className="w-full"
          >
            {SectionHeading}
            <CarouselContent className="-ml-4">
              {items.map((item: any) => {
                // For COLLECTION type, use collection data directly
                const isCollection = item.type === 'COLLECTION'
                const itemTitle = isCollection ? item.collection?.name : item.title
                const itemSubtitle = isCollection ? item.collection?.description : item.subtitle
                const image = isCollection ? item.collection?.image : item.image
                const linkUrl = isCollection
                  ? `/collections/${item.collection?.slug || ''}`
                  : (item.ctaUrl || '#')

                return (
                  <CarouselItem
                    key={item.id}
                    className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                  >
                    <Link
                      to={linkUrl}
                      target={item.linkTarget === 'BLANK' ? '_blank' : '_self'}
                      className="media-tile group relative block overflow-hidden aspect-[4/5] rounded-sm"
                    >
                      {/* Image with enhanced zoom */}
                      <img
                        src={image || '/images/products/placeholder.jpg'}
                        alt={itemTitle || ''}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Enhanced overlay with gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                      {/* Content with slide-up animation */}
                      <div className="absolute inset-0 flex flex-col justify-end p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        {itemTitle && (
                          <h3 className="text-white text-xl font-bold translate-y-0 group-hover:translate-y-0 transition-transform duration-300">
                            {itemTitle}
                          </h3>
                        )}
                        {itemSubtitle && (
                          <p className="text-white/80 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                            {itemSubtitle}
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
                )
              })}
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

// Section Renderer — wraps in <section> with deep-link id
function SectionRenderer({ section }: { section: HomepageSection }) {
  switch (section.sectionType) {
    case 'HERO':
      // Hero is a full-bleed section — id wrapper lives inside HeroSection itself
      return (
        <section id={`section-${section.slug}`} key={section.id}>
          <HeroSection section={section} />
        </section>
      )
    case 'PRODUCT_RAIL':
      // ProductRailSection sets its own id internally
      return <ProductRailSection key={section.id} section={section} />
    case 'MEDIA_TILES':
      // MediaTilesSection sets its own id internally
      return <MediaTilesSection key={section.id} section={section} />
    case 'CATEGORY_SHOWCASE':
      return (
        <section id={`section-${section.slug}`} key={section.id}>
          <CategoryShowcaseSection section={section} />
        </section>
      )
    // Legacy / future section types — warn loudly instead of silent null
    // CATEGORY_QUICK_SHOP, EDITORIAL_LOOKBOOK, NEWSLETTER_SIGNUP: Phase 2
    default:
      console.warn(`[Homepage] Unsupported section type: ${section.sectionType}`)
      return null
  }
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

  // Empty state: no CMS sections AND no feedback — show editorial placeholder
  const isEmpty = homepageSections.length === 0 && feedback.length === 0
  if (isEmpty) {
    return <EmptyHomepage />
  }

  return (
    <div>
      {/* Dynamic Homepage Sections */}
      {homepageSections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}

      {/* Hardcoded Newsletter Section */}
      <NewsletterSignupSection />
    </div>
  )
}

// ==================== NEWSLETTER SIGNUP (HARDCODED) ====================

function NewsletterSignupSection() {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      // Newsletter subscription logic (Phase 2: integrate with backend)
      await new Promise(resolve => setTimeout(resolve, 500))
      setIsSubmitted(true)
      setEmail('')
      setTimeout(() => setIsSubmitted(false), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-8 md:py-12 bg-stone-50">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          {/* Eyebrow */}
          <p className="text-xs font-serif italic text-gray-500 mb-2 uppercase tracking-[0.2em]">
            {lang === 'en' ? 'Stay Connected' : 'Kết Nối Với Chúng Tôi'}
          </p>

          {/* Heading */}
          <h2 className="text-2xl md:text-4xl font-serif font-light text-gray-900 mb-6">
            {lang === 'en' ? 'Subscribe to Our Newsletter' : 'Đăng Ký Nhận Tin'}
          </h2>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-gray-600 mb-8">
            {lang === 'en'
              ? 'Be the first to know about new collections, exclusive offers, and style tips.'
              : 'Nhận thông tin sớm nhất về bộ sưu tập mới, ưu đãi độc quyền và tips phong cách.'}
          </p>

          {/* Email Input + Submit */}
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={lang === 'en' ? 'your@email.com' : 'email@của.bạn'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-gray-900 transition"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-900 text-white text-sm uppercase font-medium tracking-[0.1em] hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" className="text-white" />
                  </span>
                ) : lang === 'en' ? (
                  'Subscribe'
                ) : (
                  'Đăng Ký'
                )}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-700 font-medium">
              {lang === 'en'
                ? '✓ Thanks for subscribing!'
                : '✓ Cảm ơn bạn đã đăng ký!'}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
