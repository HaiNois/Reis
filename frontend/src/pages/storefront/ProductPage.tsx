import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'
import { productApi, getMainImageUrl, getThumbnailImages, getImageUrl, FALLBACK_IMAGE, ProductImage } from '@/services/productApi'
import { showToast } from '@/utils/toast'

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

  // Fallback demo product if no real product
  const demoProduct = {
    id: '1',
    name: 'Áo sơ mi linen',
    description: 'Áo sơ mi được làm từ chất liệu linen 100% cao cấp, mềm mại và thoáng khí. Thiết kế oversize hiện đại, phù hợp cho nhiều phong cách.',
    material: '100% Linen',
    careGuide: 'Giặt máy nước ấm (30°C), không tẩy trắng, ủi ở nhiệt độ trung bình. Phơi trong bóng râm.',
    price: 1250000,
    compareAtPrice: 1500000,
    images: [],
    variants: [
      { id: '1', size: 'S', color: 'Trắng', price: 1250000 },
      { id: '2', size: 'M', color: 'Trắng', price: 1250000 },
      { id: '3', size: 'L', color: 'Trắng', price: 1250000 },
      { id: '4', size: 'XL', color: 'Trắng', price: 1250000 },
    ],
  }

  const currentProduct = product || demoProduct
  const productImages = currentProduct.images || []
  const thumbnails = getThumbnailImages(productImages)
  const sizes = ['S', 'M', 'L', 'XL']
  const colors = [
    { name: 'Trắng', hex: '#ffffff', border: 'border-gray-300' },
    { name: 'Đen', hex: '#000000', border: 'border-gray-900' },
    { name: 'Be', hex: '#d4c4a8', border: 'border-gray-400' },
  ]

  const handleImageClick = (imageUrl: string) => {
    setMainImage(imageUrl)
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast.warning(t('product.selectSize'))
      return
    }
    addItem({
      variantId: `${selectedSize}-${selectedColor}`,
      productId: currentProduct.id,
      productName: currentProduct.name,
      variantName: `${selectedSize} - ${selectedColor || t('product.selectColorFirst')}`,
      price: currentProduct.price,
      image: mainImage,
      maxQuantity: 10,
    }, quantity)
    showToast.success(t('product.addToCart'))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
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
            <span className="text-xl md:text-2xl">{currentProduct.price?.toLocaleString('vi-VN')} ₫</span>
            {currentProduct.compareAtPrice && (
              <span className="text-lg text-gray-400 line-through">
                {currentProduct.compareAtPrice.toLocaleString('vi-VN')} ₫
              </span>
            )}
            {currentProduct.compareAtPrice && (
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
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-8 h-8 rounded-full border-2 ${color.border} ${
                    selectedColor === color.name ? 'ring-2 ring-offset-2 ring-black' : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium uppercase tracking-wider mb-3">
              {t('product.size')}: <span className="text-gray-500 font-normal">{selectedSize || t('product.selectSize')}</span>
            </label>
            <div className="flex gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    selectedSize === size
                      ? 'bg-black text-white border-black'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {size}
                </button>
              ))}
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