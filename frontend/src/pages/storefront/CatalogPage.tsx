import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Product Card Component
function ProductCard({ product }: { product: { id: string; slug: string; name: string; price: number } }) {
  return (
    <Link to={`/products/${product.slug}`} className="product-card group">
      <div className="product-card__image bg-gray-100">
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div className="product-card__info">
        <h3 className="product-card__title group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>
        <p className="product-card__price">
          {product.price.toLocaleString('vi-VN')} ₫
        </p>
      </div>
    </Link>
  )
}

export default function CatalogPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sort, setSort] = useState('newest')

  // Demo products
  const products = [
    { id: '1', slug: 'ao-so-mi-linen', name: 'Áo sơ mi linen', price: 1250000 },
    { id: '2', slug: 'quan-jeans-relaxed', name: 'Quần jeans relaxed', price: 1890000 },
    { id: '3', slug: 'vay-midi-wrap', name: 'Váy midi wrap', price: 2150000 },
    { id: '4', slug: 'blazer-oversize', name: 'Blazer oversize', price: 3200000 },
    { id: '5', slug: 'cardigan-knit', name: 'Cardigan knit', price: 1650000 },
    { id: '6', slug: 'chan-vay-pleated', name: 'Chân váy pleated', price: 1450000 },
    { id: '7', slug: 't-shirt-basic', name: 'T-shirt basic', price: 590000 },
    { id: '8', slug: 'jumpsuit-linen', name: 'Jumpsuit linen', price: 2750000 },
  ]

  const categories = [
    { id: 'all', name: t('catalog.categories.all') },
    { id: 'shirt', name: t('catalog.categories.shirt') },
    { id: 'pants', name: t('catalog.categories.pants') },
    { id: 'dress', name: t('catalog.categories.dress') },
    { id: 'outer', name: t('catalog.categories.outer') },
  ]

  const currentCategory = searchParams.get('category') || 'all'

  return (
    <div className="container-custom py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-black">{t('common.home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-black">{t('common.products')}</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-wide mb-8">
        {t('catalog.allProducts')}
      </h1>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ category: cat.id })}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                currentCategory === cat.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{products.length} {t('catalog.allProducts').toLowerCase()}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-200 px-4 py-2 text-sm bg-transparent focus:border-black focus:outline-none"
          >
            <option value="newest">{t('catalog.newest')}</option>
            <option value="price-asc">{t('catalog.priceAsc')}</option>
            <option value="price-desc">{t('catalog.priceDesc')}</option>
            <option value="popular">{t('catalog.popular')}</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-16">
        <button className="w-10 h-10 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {[1, 2, 3].map((page) => (
          <button
            key={page}
            className="w-10 h-10 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors"
          >
            {page}
          </button>
        ))}
        <button className="w-10 h-10 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}