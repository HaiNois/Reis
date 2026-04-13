import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchProduct {
  id: string
  name: string
  nameEn?: string
  slug: string
  image?: string
  price: number
  isNew?: boolean
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language || 'vi'
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (!open) {
      setQuery('')
      setResults([])
      setSelectedIndex(-1)
    }
  }, [open])

  // Debounced search
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/v1/products?search=${encodeURIComponent(searchQuery)}&limit=8`)
      const data = await res.json()
      setResults(data.data || [])
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      searchProducts(value)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const product = results[selectedIndex]
      navigate(`/products/${product.slug}`)
      onOpenChange(false)
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  const getProductImage = (product: SearchProduct) => {
    if (product.image) {
      if (product.image.startsWith('[')) {
        try {
          const images = JSON.parse(product.image)
          return images[0] || null
        } catch {
          return null
        }
      }
      return product.image
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="relative border-b">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            ref={inputRef}
            type="text"
            placeholder={lang === 'en' ? 'Search products...' : 'Tìm kiếm sản phẩm...'}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-4 py-4 text-base border-0 focus-visible:ring-0 rounded-none"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              <p>{lang === 'en' ? 'No products found' : 'Không tìm thấy sản phẩm'}</p>
              <p className="text-sm mt-1">
                {lang === 'en' ? 'Try different keywords' : 'Thử từ khóa khác'}
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((product, index) => {
                const imageUrl = getProductImage(product)
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors',
                      selectedIndex === index && 'bg-gray-50'
                    )}
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {product.isNew && (
                          <span className="px-1.5 py-0.5 bg-black text-white text-[10px] uppercase">
                            {lang === 'en' ? 'New' : 'Mới'}
                          </span>
                        )}
                        <h4 className="font-medium text-sm truncate">
                          {lang === 'en' && product.nameEn ? product.nameEn : product.name}
                        </h4>
                      </div>
                      <p className="text-gray-600 text-sm mt-0.5">
                        {Number(product.price).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-300 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}

          {results.length > 0 && (
            <div className="p-3 border-t bg-gray-50 text-center">
              <p className="text-xs text-gray-500">
                {lang === 'en'
                  ? `Press Enter to select, ↑↓ to navigate`
                  : `Nhấn Enter để chọn, ↑↓ để di chuyển`}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SearchDialog
