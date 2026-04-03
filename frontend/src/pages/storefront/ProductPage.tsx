import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'
import { productApi, getMainImageUrl, getThumbnailImages, getImageUrl, FALLBACK_IMAGE, ProductImage } from '@/services/productApi'
import { showToast } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { ProductVariant } from '@/services/productApi'

interface ColorOption {
  name: string
  hex: string
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [mainImage, setMainImage] = useState(FALLBACK_IMAGE)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)

  const addItem = useCartStore((state) => state.addItem)
  const lang = i18n.language

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return
      try {
        const response = await productApi.getProductBySlug(slug)
        setProduct(response.data)

        // Set main image from product images
        if (response.data.images && response.data.images.length > 0) {
          setMainImage(getMainImageUrl(response.data.images))
        }
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

  const currentProduct = product
  const productImages = currentProduct?.images || []
  const thumbnails = getThumbnailImages(productImages)
  const variants: ProductVariant[] = currentProduct?.variants || []

  // Extract unique colors and sizes from variants
  const { colors, sizes } = useMemo(() => {
    const colorMap = new Map<string, ColorOption>()
    const sizeSet = new Set<string>()
    const colorDefaults: Record<string, string> = {
      'trắng': '#ffffff', 'white': '#ffffff',
      'đen': '#000000', 'black': '#000000',
      'be': '#d4c4a8', 'beige': '#d4c4a8',
      'xanh navy': '#000080', 'navy': '#000080', 'navy blue': '#000080',
      'xám': '#808080', 'gray': '#808080', 'grey': '#808080',
      'đỏ': '#ff0000', 'red': '#ff0000',
      'hồng': '#ffc0cb', 'pink': '#ffc0cb',
      'xanh': '#008000', 'green': '#008000', 'forest': '#228b22',
      'nâu': '#8b4513', 'brown': '#8b4513',
      'cam': '#ffa500', 'orange': '#ffa500',
      'tím': '#800080', 'purple': '#800080',
      'vàng': '#ffff00', 'yellow': '#ffff00', 'gold': '#ffd700',
    }

    variants.forEach((v: ProductVariant) => {
      if (v.color) {
        sizeSet.add(v.size)
        if (!colorMap.has(v.color)) {
          colorMap.set(v.color, {
            name: v.color,
            hex: colorDefaults[v.color.toLowerCase()] || '#888888',
          })
        }
      }
    })

    return {
      colors: Array.from(colorMap.values()),
      sizes: Array.from(sizeSet).sort((a, b) => {
        const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
        const indexA = order.indexOf(a.toUpperCase())
        const indexB = order.indexOf(b.toUpperCase())
        // If size not in order list, put it at the end
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
      }),
    }
  }, [variants])

  // Find selected variant based on color + size
  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null
    return variants.find((v: ProductVariant) =>
      v.color === selectedColor && v.size === selectedSize
    )
  }, [variants, selectedColor, selectedSize])

  // Available sizes for selected color
  const availableSizes = useMemo(() => {
    if (!selectedColor) return new Set<string>()
    return new Set(
      variants
        .filter((v: ProductVariant) => v.color === selectedColor && v.quantity > 0)
        .map((v: ProductVariant) => v.size)
    )
  }, [variants, selectedColor])

  // Current price (from variant or product)
  const currentPrice = selectedVariant?.salePrice || selectedVariant?.price || currentProduct?.price || 0
  const currentCompareAtPrice =
    selectedVariant?.price && selectedVariant?.salePrice && selectedVariant.price > selectedVariant.salePrice
      ? selectedVariant.price
      : currentProduct?.compareAtPrice

  const handleImageClick = (imageUrl: string) => {
    setMainImage(imageUrl)
  }

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

    addItem({
      variantId: selectedVariant.id,
      productId: currentProduct.id,
      productName: currentProduct.name,
      variantName: `${selectedSize} - ${selectedColor}`,
      price: currentPrice,
      image: mainImage,
      maxQuantity: selectedVariant.quantity,
    }, quantity)
    showToast.success(t('product.addToCart'))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div className="container-custom py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-black">{t('common.home')}</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-black">{t('common.products')}</Link>
        <span className="mx-2">/</span>
        <span className="text-black">{currentProduct.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={mainImage}
              alt={lang === 'en' && currentProduct.nameEn ? currentProduct.nameEn : currentProduct.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {thumbnails.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {thumbnails.map((img: ProductImage, index: number) => (
                <button
                  key={img.id || index}
                  onClick={() => handleImageClick(getImageUrl(img))}
                  className={`w-20 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    mainImage === getImageUrl(img) ? 'border-black' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
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

          {/* Color Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium uppercase tracking-wider mb-3">
              {t('product.color')}: <span className="text-gray-500 font-normal">{selectedColor || t('product.selectColorFirst')}</span>
            </label>
            <div className="flex gap-3">
              {colors.map((color) => {
                const isLight = ['#ffffff', '#ffc0cb', '#d4c4a8'].includes(color.hex.toLowerCase())
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      isLight ? 'border-gray-300' : 'border-gray-900'
                    } ${selectedColor === color.name ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                )
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium uppercase tracking-wider mb-3">
              {t('product.size')}: <span className="text-gray-500 font-normal">{selectedSize || t('product.selectSize')}</span>
            </label>
            <div className="flex gap-2">
              {sizes.map((size) => {
                const isAvailable = availableSizes.has(size)
                return (
                  <button
                    key={size}
                    onClick={() => isAvailable && setSelectedSize(size)}
                    disabled={!isAvailable}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      selectedSize === size
                        ? 'bg-black text-white border-black'
                        : isAvailable
                        ? 'border-gray-300 hover:border-gray-400'
                        : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                    }`}
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
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center"
              >
                -
              </button>
              <span className="w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center"
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
                {lang === 'en' && currentProduct.descriptionEn ? currentProduct.descriptionEn : currentProduct.description}
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
                {lang === 'en' && currentProduct.materialEn ? currentProduct.materialEn : currentProduct.material}
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
                {lang === 'en' && currentProduct.careGuideEn ? currentProduct.careGuideEn : currentProduct.careGuide}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}