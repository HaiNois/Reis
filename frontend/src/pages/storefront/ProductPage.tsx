import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'
import {
  productApi,
  getMainImageUrl,
  getImageUrl,
  FALLBACK_IMAGE,
  ProductImage,
  ProductVariant,
} from '@/services/productApi'
import { showToast } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { ColorSelector, extractColorsFromVariants, getAvailableColors, ColorOption } from '@/components/product/color-selector'
import { SIZE_ORDER } from '@/config/product'

interface ProductDetailProps {
  productSlug?: string
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [mainImage, setMainImage] = useState(FALLBACK_IMAGE)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<{
    id: string
    name: string
    nameEn?: string
    slug: string
    description?: string
    descriptionEn?: string
    material?: string
    materialEn?: string
    careGuide?: string
    careGuideEn?: string
    price: number
    compareAtPrice?: number
    image?: string
    images: ProductImage[]
    variants: ProductVariant[]
  } | null>(null)

  // Zoom state
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const addItem = useCartStore((state) => state.addItem)
  const lang = i18n.language

  // ==================== FETCH PRODUCT ====================

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return
      try {
        const response = await productApi.getProductBySlug(slug)
        setProduct(response.data)

        // Set main image
        let imageUrl = FALLBACK_IMAGE
        if (response.data.image) {
          try {
            const imageUrls = JSON.parse(response.data.image)
            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
              imageUrl = imageUrls[0]
            }
          } catch {
            imageUrl = response.data.image
          }
        } else if (response.data.images && response.data.images.length > 0) {
          imageUrl = getMainImageUrl(response.data.images)
        }
        setMainImage(imageUrl)
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [slug])

  // Reset selection when product changes
  useEffect(() => {
    setSelectedSize('')
    setSelectedColor('')
    setQuantity(1)
  }, [product?.id])

  // ==================== PRODUCT DATA ====================

  const currentProduct = product
  const variants: ProductVariant[] = currentProduct?.variants || []

  // ==================== IMAGE HANDLING ====================

  // Build images array from legacy `image` field or new `images` relation
  const productImages = useMemo(() => {
    if (currentProduct?.images && currentProduct.images.length > 0) {
      return currentProduct.images
    }
    if (currentProduct?.image) {
      try {
        const imageUrls = JSON.parse(currentProduct.image)
        if (Array.isArray(imageUrls)) {
          return imageUrls.map((url: string, idx: number) => ({
            id: String(idx),
            publicUrl: url,
            url,
            objectKey: '',
            sortOrder: idx,
            isPrimary: idx === 0,
          }))
        }
      } catch {
        return []
      }
    }
    return []
  }, [currentProduct?.image, currentProduct?.images])

  const thumbnails = productImages.slice(1)

  // ==================== VARIANT LOGIC ====================

  // Extract unique colors from variants
  const colors: ColorOption[] = useMemo(() => {
    return extractColorsFromVariants(variants)
  }, [variants])

  // Extract unique sizes from variants (sorted)
  const sizes = useMemo(() => {
    const sizeSet = new Set<string>()
    variants.forEach((v: ProductVariant) => {
      if (v.size) {
        sizeSet.add(v.size)
      }
    })
    return Array.from(sizeSet).sort((a, b) => {
      const indexA = SIZE_ORDER.indexOf(a.toUpperCase() as typeof SIZE_ORDER[number])
      const indexB = SIZE_ORDER.indexOf(b.toUpperCase() as typeof SIZE_ORDER[number])
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
  }, [variants])

  // Available colors (colors with stock)
  const availableColors = useMemo(() => {
    return getAvailableColors(variants)
  }, [variants])

  // Find selected variant based on color + size
  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null
    return variants.find(
      (v: ProductVariant) => v.color === selectedColor && v.size === selectedSize
    )
  }, [variants, selectedColor, selectedSize])

  // Available sizes for selected color (only show sizes with stock)
  const availableSizes = useMemo(() => {
    if (!selectedColor) return new Set<string>()
    return new Set(
      variants
        .filter((v: ProductVariant) => v.color === selectedColor && v.quantity > 0)
        .map((v: ProductVariant) => v.size)
    )
  }, [variants, selectedColor])

  // ==================== PRICE HANDLING ====================

  const currentPrice =
    selectedVariant?.salePrice || selectedVariant?.price || currentProduct?.price || 0
  const currentCompareAtPrice =
    selectedVariant?.price &&
    selectedVariant?.salePrice &&
    selectedVariant.price > selectedVariant.salePrice
      ? selectedVariant.price
      : currentProduct?.compareAtPrice

  // ==================== IMAGE HANDLERS ====================

  const handleImageClick = (imageUrl: string) => {
    setMainImage(imageUrl)
  }

  // Zoom handlers
  const handleMouseEnter = () => setIsZooming(true)
  const handleMouseLeave = () => setIsZooming(false)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }, [])

  const handleAddToCart = () => {
    if (!selectedColor) {
      showToast.warning(t('product.selectColor'))
      return
    }
    if (!selectedSize) {
      showToast.warning(t('product.selectSize'))
      return
    }
    if (!selectedVariant) {
      showToast.warning(t('product.variantNotAvailable'))
      return
    }

    addItem(
      {
        variantId: selectedVariant.id,
        productId: currentProduct!.id,
        productName: currentProduct!.name,
        variantName: `${selectedSize} - ${selectedColor}`,
        price: currentPrice,
        image: mainImage,
        maxQuantity: selectedVariant.quantity,
      },
      quantity
    )
    showToast.success(t('product.addToCart'))
  }

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  if (!currentProduct) {
    return (
      <div className="container-custom py-8 md:py-12">
        <p className="text-center text-gray-500">{t('common.error')}</p>
      </div>
    )
  }

  return (
    <div className="container-custom py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-black">
          {t('common.home')}
        </Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-black">
          {t('common.products')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black">{currentProduct.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image with Zoom */}
          <div
            ref={imageContainerRef}
            className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          >
            <img
              src={mainImage}
              alt={lang === 'en' && currentProduct.nameEn ? currentProduct.nameEn : currentProduct.name}
              className="w-full h-full object-cover transition-transform duration-200 ease-out"
              style={{
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                transform: isZooming ? 'scale(1.5)' : 'scale(1)',
              }}
            />
          </div>

          {/* Thumbnails */}
          {thumbnails.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {thumbnails.map((img: ProductImage, index: number) => {
                const imgUrl = img.publicUrl || img.url || ''
                return (
                  <button
                    key={img.id || index}
                    onClick={() => handleImageClick(imgUrl)}
                    className={`w-20 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      mainImage === imgUrl
                        ? 'border-black'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:py-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
            {lang === 'en' && currentProduct.nameEn ? currentProduct.nameEn : currentProduct.name}
          </h1>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl md:text-2xl">{currentPrice.toLocaleString('vi-VN')} ₫</span>
            {currentCompareAtPrice && (
              <span className="text-lg text-gray-400 line-through">
                {currentCompareAtPrice.toLocaleString('vi-VN')} ₫
              </span>
            )}
            {selectedVariant?.salePrice && selectedVariant.salePrice > 0 && (
              <span className="px-2 py-1 bg-red-sale text-white text-xs uppercase">
                {t('product.sale')}
              </span>
            )}
          </div>

          {/* Color Selection - Using ColorSelector Component */}
          <ColorSelector
            colors={colors}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            availableColors={availableColors}
            showLabel
          />

          {/* Size Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium uppercase tracking-wider mb-3">
              {t('product.size')}:{' '}
              <span className="text-gray-500 font-normal normal-case">
                {selectedSize || t('product.selectSizeFirst')}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const isAvailable = availableSizes.has(size)
                return (
                  <button
                    key={size}
                    onClick={() => isAvailable && setSelectedSize(size)}
                    disabled={!isAvailable}
                    className={`
                      px-4 py-2 border rounded-lg transition-colors min-w-[48px]
                      ${selectedSize === size
                        ? 'bg-black text-white border-black'
                        : isAvailable
                          ? 'border-gray-300 hover:border-gray-400'
                          : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                      }
                    `}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium uppercase tracking-wider mb-3">
              {t('product.quantity')}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className="w-full py-4 bg-black text-white uppercase tracking-wider hover:bg-gray-800 transition-colors rounded-lg mb-4"
          >
            {t('product.addToCart')}
          </button>

          {/* Description */}
          {currentProduct.description && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-sm font-medium uppercase tracking-wider mb-3">
                {t('product.description')}
              </h3>
              <p className="text-gray-600 whitespace-pre-line">
                {lang === 'en' && currentProduct.descriptionEn
                  ? currentProduct.descriptionEn
                  : currentProduct.description}
              </p>
            </div>
          )}

          {/* Material */}
          {currentProduct.material && (
            <div className="mt-6">
              <h3 className="text-sm font-medium uppercase tracking-wider mb-2">
                {t('product.material')}
              </h3>
              <p className="text-gray-600">
                {lang === 'en' && currentProduct.materialEn
                  ? currentProduct.materialEn
                  : currentProduct.material}
              </p>
            </div>
          )}

          {/* Care Guide */}
          {currentProduct.careGuide && (
            <div className="mt-6">
              <h3 className="text-sm font-medium uppercase tracking-wider mb-2">
                {t('product.careGuide')}
              </h3>
              <p className="text-gray-600">
                {lang === 'en' && currentProduct.careGuideEn
                  ? currentProduct.careGuideEn
                  : currentProduct.careGuide}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
