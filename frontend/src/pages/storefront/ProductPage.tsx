import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'
import { usePrice } from '@/hooks/usePrice'
import { productApi, getMainImageUrl, FALLBACK_IMAGE } from '@/services/productApi'
import { showToast } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { ProductVariant } from '@/services/productApi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Ruler } from 'lucide-react'

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

  // Zoom state
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const addItem = useCartStore((state) => state.addItem)
  const fmt = usePrice()
  const lang = i18n.language
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [addToCartState, setAddToCartState] = useState<'idle' | 'loading' | 'success'>('idle')

  // Size guide data (will come from CMS in Phase 2)
  const sizeGuideData = {
    tops: {
      title: 'Áo & Áo Khoác',
      headers: ['Size', 'Vòng ngực (cm)', 'Vòng eo (cm)', 'Chiều dài (cm)'],
      rows: [
        ['XS', '82-86', '62-66', '58'],
        ['S', '86-90', '66-70', '60'],
        ['M', '90-94', '70-74', '62'],
        ['L', '94-98', '74-78', '64'],
        ['XL', '98-102', '78-82', '66'],
        ['XXL', '102-106', '82-86', '68'],
      ],
    },
    bottoms: {
      title: 'Quần & Váy',
      headers: ['Size', 'Vòng eo (cm)', 'Vòng mông (cm)', 'Chiều dài (cm)'],
      rows: [
        ['XS', '60-64', '84-88', '90'],
        ['S', '64-68', '88-92', '92'],
        ['M', '68-72', '92-96', '94'],
        ['L', '72-76', '96-100', '96'],
        ['XL', '76-80', '100-104', '98'],
        ['XXL', '80-84', '104-108', '100'],
      ],
    },
  }

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return
      try {
        const response = await productApi.getProductBySlug(slug)
        setProduct(response.data)

        // Set main image - handle both legacy `image` string and new `images` array
        let imageUrl = FALLBACK_IMAGE
        if (response.data.image) {
          // Legacy: image is a JSON string array
          try {
            const imageUrls = JSON.parse(response.data.image)
            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
              imageUrl = imageUrls[0]
            }
          } catch {
            imageUrl = response.data.image
          }
        } else if (response.data.images && response.data.images.length > 0) {
          // New: images array with publicUrl/url
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

  const currentProduct = product

  // Build images array from legacy `image` field or new `images` relation
  const productImages = (() => {
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
  })()

  const thumbnails = productImages.slice(1) // All except first
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
  const hasVariantSalePrice = selectedVariant?.salePrice && selectedVariant?.salePrice > 0
  const currentPrice = hasVariantSalePrice
    ? selectedVariant!.salePrice!
    : (selectedVariant?.price || currentProduct?.price || 0)
  const currentCompareAtPrice = hasVariantSalePrice
    ? (selectedVariant!.price > selectedVariant!.salePrice! ? selectedVariant!.price : undefined)
    : undefined
  // priceUsd companion (only available when a variant is selected)
  const currentPriceUsd: number | null = hasVariantSalePrice
    ? null // sale price has no USD equivalent in DB; let formatter fallback
    : (selectedVariant?.priceUsd ?? currentProduct?.priceUsd ?? null)
  const currentCompareAtPriceUsd: number | null = hasVariantSalePrice
    ? (selectedVariant?.priceUsd ?? null)
    : null

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

  const handleAddToCart = async () => {
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

    setAddToCartState('loading')
    // Simulate small delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 300))

    addItem({
      variantId: selectedVariant.id,
      productId: currentProduct.id,
      productSlug: currentProduct.slug,
      productName: currentProduct.name,
      variantName: `${selectedSize} - ${selectedColor}`,
      price: Number(currentPrice),
      priceUsd: currentPriceUsd ?? null,
      image: mainImage,
      maxQuantity: selectedVariant.quantity,
    }, quantity)

    setAddToCartState('success')
    showToast.success(t('product.addToCart'))

    // Reset state after 2s
    setTimeout(() => setAddToCartState('idle'), 2000)
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
              {thumbnails.map((img: any, index: number) => {
                // Handle both new ProductImage format and legacy {publicUrl, url} format
                const imgUrl = img.publicUrl || img.url || ''
                return (
                  <button
                    key={img.id || index}
                    onClick={() => handleImageClick(imgUrl)}
                    className={`w-20 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      mainImage === imgUrl ? 'border-black' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
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
            <span className="text-xl md:text-2xl">{fmt(currentPrice, currentPriceUsd)}</span>
            {currentCompareAtPrice && (
              <span className="text-lg text-gray-400 line-through">
                {fmt(currentCompareAtPrice, currentCompareAtPriceUsd)}
              </span>
            )}
            {hasVariantSalePrice && (
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
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium uppercase tracking-wider">
                {t('product.size')}: <span className="text-gray-500 font-normal">{selectedSize || t('product.selectSize')}</span>
              </label>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors"
              >
                <Ruler className="w-4 h-4" />
                {t('product.sizeGuide')}
              </button>
            </div>
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
            disabled={addToCartState !== 'idle'}
            className={`w-full py-4 uppercase tracking-wider rounded-lg mb-4 transition-all ${
              addToCartState === 'success'
                ? 'bg-green-600 text-white'
                : addToCartState === 'loading'
                ? 'bg-gray-400 text-white cursor-wait'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {addToCartState === 'success' ? '✓ ' + t('product.addedToCart') : t('product.addToCart')}
          </button>

          {/* Desktop only - Description */}
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

          {/* Desktop only - Material */}
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

          {/* Desktop only - Care Guide */}
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

      {/* Mobile Sticky Add-to-Cart Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
        <div className="container-custom py-3 flex items-center gap-4">
          <div className="flex-1">
            <p className="font-medium">{currentProduct?.name}</p>
            <p className="text-lg font-bold">{fmt(currentPrice, currentPriceUsd)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={addToCartState !== 'idle'}
            className={`px-8 py-3 uppercase tracking-wider rounded-lg font-medium transition-all ${
              addToCartState === 'success'
                ? 'bg-green-600 text-white'
                : addToCartState === 'loading'
                ? 'bg-gray-400 text-white cursor-wait'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {addToCartState === 'success' ? '✓' : t('product.addToCart')}
          </button>
        </div>
      </div>

      {/* Size Guide Modal */}
      <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('product.sizeGuide')}</DialogTitle>
            <DialogDescription>
              {lang === 'vi'
                ? 'Tham khảo bảng size để chọn kích thước phù hợp. Đo chính xác cơ thể và so sánh với bảng bên dưới.'
                : 'Use this size guide to find your perfect fit. Measure your body accurately and compare with the chart below.'}
            </DialogDescription>
          </DialogHeader>

          {/* Tops Size Chart */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">{sizeGuideData.tops.title}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {sizeGuideData.tops.headers.map((header, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeGuideData.tops.rows.map((row, i) => (
                    <tr key={i} className="border-b">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Bottoms Size Chart */}
          <div>
            <h4 className="font-medium mb-3">{sizeGuideData.bottoms.title}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {sizeGuideData.bottoms.headers.map((header, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeGuideData.bottoms.rows.map((row, i) => (
                    <tr key={i} className="border-b">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* How to measure */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">
              {lang === 'vi' ? 'Cách đo cơ thể' : 'How to measure'}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>{lang === 'vi' ? 'Vòng ngực' : 'Bust'}:</strong> {lang === 'vi' ? 'Đo quanh phần rộng nhất của ngực' : 'Measure around the fullest part of your bust'}</li>
              <li>• <strong>{lang === 'vi' ? 'Vòng eo' : 'Waist'}:</strong> {lang === 'vi' ? 'Đo quanh phần thắt nhất của eo' : 'Measure around the narrowest part of your waist'}</li>
              <li>• <strong>{lang === 'vi' ? 'Vòng mông' : 'Hips'}:</strong> {lang === 'vi' ? 'Đo quanh phần rộng nhất của mông' : 'Measure around the fullest part of your hips'}</li>
            </ul>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setSizeGuideOpen(false)}>
              {lang === 'vi' ? 'Đóng' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}