import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'

export default function ProductPage() {
  useParams() // Get params for routing
  const { t } = useTranslation()
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  // Demo product
  const product = {
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
      { id: '5', size: 'S', color: 'Đen', price: 1250000 },
      { id: '6', size: 'M', color: 'Đen', price: 1250000 },
    ],
  }

  const sizes = ['S', 'M', 'L', 'XL']
  const colors = [
    { name: 'Trắng', hex: '#ffffff', border: 'border-gray-300' },
    { name: 'Đen', hex: '#000000', border: 'border-gray-900' },
    { name: 'Be', hex: '#d4c4a8', border: 'border-gray-400' },
  ]

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert(t('product.selectSize'))
      return
    }
    addItem({
      variantId: `${selectedSize}-${selectedColor}`,
      productId: product.id,
      productName: product.name,
      variantName: `${selectedSize} - ${selectedColor || t('product.selectColorFirst')}`,
      price: product.price,
      image: '',
      maxQuantity: 10,
    }, quantity)
    alert(t('product.addToCart'))
  }

  return (
    <div className="container-custom py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-black">{t('common.home')}</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-black">{t('common.products')}</Link>
        <span className="mx-2">/</span>
        <span className="text-black">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="aspect-[3/4] bg-gray-100">
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Product Info */}
        <div className="lg:py-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{product.name}</h1>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl md:text-2xl">{product.price.toLocaleString('vi-VN')} ₫</span>
            {product.compareAtPrice && (
              <span className="text-lg text-gray-400 line-through">
                {product.compareAtPrice.toLocaleString('vi-VN')} ₫
              </span>
            )}
            {product.compareAtPrice && (
              <span className="px-2 py-1 bg-red-sale text-white text-xs uppercase">
                {t('product.sale')}
              </span>
            )}
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium uppercase tracking-wider mb-3">
              {t('product.color')}: <span className="font-normal text-gray-600">{selectedColor || t('product.selectColorFirst')}</span>
            </label>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-10 h-10 border ${color.border} ${
                    selectedColor === color.name ? 'ring-2 ring-black ring-offset-2' : ''
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
              {t('product.size')}: <span className="font-normal text-gray-600">{selectedSize || t('product.selectSizeFirst')}</span>
            </label>
            <div className="flex gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 border text-sm transition-colors ${
                    selectedSize === size
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <Link to="/size-guide" className="inline-block mt-2 text-sm text-gray-500 hover:text-black underline">
              {t('product.sizeGuide')}
            </Link>
          </div>

          {/* Quantity */}
          <div className="mb-8">
            <label className="block text-sm font-medium uppercase tracking-wider mb-3">
              {t('product.quantity')}
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="btn btn-primary w-full mb-4"
          >
            {t('product.addToCart')}
          </button>
          <button
            onClick={handleAddToCart}
            className="btn btn-outline w-full"
          >
            {t('product.buyNow')}
          </button>

          {/* Product Details Accordion */}
          <div className="mt-12 border-t border-gray-200">
            <details className="group py-4 border-b border-gray-200">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-sm font-medium uppercase tracking-wider">{t('product.description')}</span>
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </details>

            <details className="group py-4 border-b border-gray-200">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-sm font-medium uppercase tracking-wider">{t('product.material')}</span>
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-sm text-gray-600">{product.material}</p>
            </details>

            <details className="group py-4 border-b border-gray-200">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-sm font-medium uppercase tracking-wider">{t('product.careGuide')}</span>
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-sm text-gray-600">{product.careGuide}</p>
            </details>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-16 md:mt-24 pt-16 border-t">
        <h2 className="text-2xl font-display font-bold tracking-wide mb-8">
          {t('product.relatedProducts')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Link key={i} to="/products" className="product-card group">
              <div className="product-card__image bg-gray-100">
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="product-card__info">
                <h3 className="product-card__title">{t('product.relatedProducts')} {i}</h3>
                <p className="product-card__price">1,200,000 ₫</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}