import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { productApi, categoryApi, FALLBACK_IMAGE } from '../../services/productApi'
import { usePrice } from '@/hooks/usePrice'

interface ProductData {
  id: string
  slug: string
  name: string
  nameEn?: string
  price: string | number
  priceUsd?: string | number | null
  compareAtPrice?: string | number | null
  compareAtPriceUsd?: string | number | null
  image?: string
  images?: Array<{ id: string; publicUrl?: string; objectKey?: string; url?: string }>
  status: string
}

interface CategoryData {
  id: string
  slug: string
  name: string
  nameEn?: string
  productCount?: number
}

// Product Card Component
function ProductCard({ product }: { product: ProductData }) {
  const fmt = usePrice()
  // Get main image URL - handle both legacy `image` string and `images` array
  let imageUrl = FALLBACK_IMAGE

  if (product.image) {
    // Legacy: image is a JSON string array
    try {
      const imageUrls = JSON.parse(product.image)
      if (Array.isArray(imageUrls) && imageUrls.length > 0) {
        imageUrl = imageUrls[0]
      }
    } catch {
      imageUrl = product.image
    }
  } else if (product.images && product.images.length > 0) {
    // New: images array with publicUrl/url
    const firstImage = product.images[0]
    imageUrl = firstImage.publicUrl || firstImage.url || FALLBACK_IMAGE
  }

  return (
    <Link to={`/products/${product.slug}`} className="product-card group">
      <div className="product-card__image bg-gray-100">
        {imageUrl !== FALLBACK_IMAGE ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="product-card__info">
        <h3 className="product-card__title group-hover:text-gray-600 transition-colors">
          {product.name}
        </h3>
        <p className="product-card__price">
          {fmt(product.price as number, product.priceUsd as number | null | undefined)}
          {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
            <span className="ml-2 text-gray-400 line-through text-sm">
              {fmt(product.compareAtPrice as number, product.compareAtPriceUsd as number | null | undefined)}
            </span>
          )}
        </p>
      </div>
    </Link>
  )
}

export default function CatalogPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [searchParams, setSearchParams] = useSearchParams()
  const [sort, setSort] = useState('newest')
  const [products, setProducts] = useState<ProductData[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const currentCategory = searchParams.get('category') || undefined
      const page = parseInt(searchParams.get('page') || '1')

      const response = await productApi.getProducts({
        category: currentCategory !== 'all' ? currentCategory : undefined,
        sort: sort === 'newest' ? undefined : sort,
        status: 'ACTIVE',
        page,
        limit: 20,
      })

      setProducts(response.data)
      setMeta(response.meta)
    } catch (err: any) {
      setError(err.message || 'Failed to load products')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }, [searchParams, sort])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getCategories()
        setCategories(response.data)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

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
          <button
            key="all"
            onClick={() => setSearchParams({ category: 'all', page: '1' })}
            className={`px-4 py-2 text-sm whitespace-nowrap transition-colors ${
              currentCategory === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('catalog.categories.all')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSearchParams({ category: cat.slug, page: '1' })
              }}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                currentCategory === cat.slug
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang === 'en' && cat.nameEn ? cat.nameEn : cat.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{meta.total} {t('catalog.allProducts').toLowerCase()}</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              setSearchParams((prev) => { prev.set('page', '1'); return prev })
            }}
            className="border border-gray-200 px-4 py-2 text-sm bg-transparent focus:border-black focus:outline-none"
          >
            <option value="newest">{t('catalog.newest')}</option>
            <option value="price-asc">{t('catalog.priceAsc')}</option>
            <option value="price-desc">{t('catalog.priceDesc')}</option>
            <option value="popular">{t('catalog.popular')}</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p>Không tìm thấy sản phẩm nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-16">
              <button
                onClick={() => setSearchParams((prev) => { prev.set('page', String(meta.page - 1)); return prev })}
                disabled={meta.page <= 1}
                className="w-10 h-10 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setSearchParams((prev) => { prev.set('page', String(page)); return prev })}
                  className={`w-10 h-10 border transition-colors ${
                    meta.page === page
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-black hover:bg-black hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setSearchParams((prev) => { prev.set('page', String(meta.page + 1)); return prev })}
                disabled={meta.page >= meta.totalPages}
                className="w-10 h-10 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}