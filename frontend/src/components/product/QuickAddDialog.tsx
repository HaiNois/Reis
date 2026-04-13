import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'
import { productApi, ProductVariant, FALLBACK_IMAGE, getImageUrl } from '@/services/productApi'
import { showToast } from '@/utils/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, Minus, Plus, X } from 'lucide-react'

interface ColorOption {
  name: string
  hex: string
}

interface QuickAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productSlug: string
  productName: string
  productImage?: string
  basePrice: number
}

export function QuickAddDialog({
  open,
  onOpenChange,
  productSlug,
  productName,
  productImage,
  basePrice,
}: QuickAddDialogProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const addItem = useCartStore((state) => state.addItem)

  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

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
    'xanh mint': '#98ff98', 'mint': '#98ff98',
    'bạc': '#c0c0c0', 'silver': '#c0c0c0',
  }

  // Fetch product details when dialog opens
  useEffect(() => {
    if (open && !product) {
      const fetchProduct = async () => {
        setLoading(true)
        try {
          const response = await productApi.getProductBySlug(productSlug)
          setProduct(response.data)
        } catch (error) {
          console.error('Failed to fetch product:', error)
          showToast.error(lang === 'vi' ? 'Không thể tải sản phẩm' : 'Failed to load product')
        } finally {
          setLoading(false)
        }
      }
      fetchProduct()
    }
  }, [open, productSlug, product, lang])

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedColor('')
      setSelectedSize('')
      setQuantity(1)
    }
  }, [open])

  const variants: ProductVariant[] = product?.variants || []

  // Extract unique colors and sizes from variants
  const { colors, sizes } = useMemo(() => {
    const colorMap = new Map<string, ColorOption>()
    const sizeSet = new Set<string>()

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
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
      }),
    }
  }, [variants])

  // Find selected variant
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

  // Price based on variant
  const currentPrice = selectedVariant?.salePrice && selectedVariant?.salePrice > 0
    ? selectedVariant.salePrice
    : (selectedVariant?.price || basePrice)

  // Current image based on color selection
  const currentImage = useMemo(() => {
    if (!product?.images || product.images.length === 0) {
      return productImage || FALLBACK_IMAGE
    }
    // Try to find image matching selected color (if images have color metadata)
    // For now, use first available image
    return getImageUrl(product.images[0]) || productImage || FALLBACK_IMAGE
  }, [product, productImage])

  const handleAddToCart = async () => {
    if (!selectedColor) {
      showToast.warning(lang === 'vi' ? 'Vui lòng chọn màu sắc' : 'Please select a color')
      return
    }
    if (!selectedSize) {
      showToast.warning(lang === 'vi' ? 'Vui lòng chọn kích thước' : 'Please select a size')
      return
    }
    if (!selectedVariant) {
      showToast.warning(lang === 'vi' ? 'Kích thước này không có sẵn' : 'This size is not available')
      return
    }
    if (selectedVariant.quantity < quantity) {
      showToast.warning(lang === 'vi' ? 'Số lượng vượt quá tồn kho' : 'Quantity exceeds available stock')
      return
    }

    setAdding(true)
    try {
      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        productName: productName,
        variantName: `${selectedColor} / ${selectedSize}`,
        price: Number(currentPrice),
        image: currentImage,
        maxQuantity: selectedVariant.quantity,
      }, quantity)

      showToast.success(
        lang === 'vi'
          ? `Đã thêm "${productName} - ${selectedColor} / ${selectedSize}" vào giỏ hàng`
          : `Added "${productName} - ${selectedColor} / ${selectedSize}" to cart`
      )
      onOpenChange(false)
    } catch (error) {
      showToast.error(lang === 'vi' ? 'Thêm vào giỏ hàng thất bại' : 'Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(prev + delta, selectedVariant?.quantity || 10)))
  }

  if (variants.length === 0 && !loading) {
    // No variants - simple add to cart
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">{productName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-4 py-4">
            <img
              src={currentImage}
              alt={productName}
              className="w-20 h-20 object-cover rounded"
            />
            <div>
              <p className="text-lg font-semibold">
                {Number(currentPrice).toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-sm text-gray-500">
                {lang === 'vi' ? 'Đã có sẵn' : 'In stock'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {lang === 'vi' ? 'Số lượng:' : 'Quantity:'}
            </span>
            <div className="flex items-center border rounded">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="p-2 hover:bg-gray-100 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full bg-black hover:bg-gray-800 text-white mt-4"
          >
            {adding ? (lang === 'vi' ? 'Đang thêm...' : 'Adding...') : (lang === 'vi' ? 'Thêm vào giỏ hàng' : 'Add to Cart')}
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">{productName}</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Product preview */}
            <div className="flex items-center gap-4">
              <img
                src={currentImage}
                alt={productName}
                className="w-20 h-20 object-cover rounded"
              />
              <div>
                <p className="text-lg font-semibold">
                  {Number(currentPrice).toLocaleString('vi-VN')} ₫
                </p>
                {selectedVariant && (
                  <p className="text-sm text-gray-500">
                    {selectedVariant.quantity > 0
                      ? (lang === 'vi' ? 'Còn hàng' : 'In stock')
                      : (lang === 'vi' ? 'Hết hàng' : 'Out of stock')
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {lang === 'vi' ? 'Màu sắc:' : 'Color:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => {
                        setSelectedColor(color.name)
                        setSelectedSize('') // Reset size when color changes
                      }}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 transition-all relative',
                        selectedColor === color.name
                          ? 'border-black scale-110'
                          : 'border-gray-200 hover:border-gray-400'
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <Check
                          className={cn(
                            'absolute inset-0 m-auto w-5 h-5',
                            color.hex === '#ffffff' || color.hex === '#ffff00' || color.hex === '#ffd700'
                              ? 'text-black'
                              : 'text-white'
                          )}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {selectedColor && sizes.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {lang === 'vi' ? 'Kích thước:' : 'Size:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const isAvailable = availableSizes.has(size)
                    const isSelected = selectedSize === size

                    return (
                      <button
                        key={size}
                        onClick={() => isAvailable && setSelectedSize(size)}
                        disabled={!isAvailable}
                        className={cn(
                          'min-w-[48px] px-4 py-2 border-2 rounded transition-all font-medium',
                          isSelected
                            ? 'border-black bg-black text-white'
                            : isAvailable
                            ? 'border-gray-200 hover:border-gray-400'
                            : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                        )}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {lang === 'vi' ? 'Số lượng:' : 'Quantity:'}
              </span>
              <div className="flex items-center border rounded">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                  disabled={!!(selectedVariant && quantity >= selectedVariant.quantity)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {selectedVariant && (
                <span className="text-xs text-gray-500">
                  {lang === 'vi' ? 'Còn' : 'Available'}: {selectedVariant.quantity}
                </span>
              )}
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={adding || !!(selectedColor && selectedSize && !selectedVariant)}
              className="w-full bg-black hover:bg-gray-800 text-white mt-4"
            >
              {adding ? (
                (lang === 'vi' ? 'Đang thêm...' : 'Adding...')
              ) : !selectedColor || !selectedSize ? (
                (lang === 'vi' ? 'Chọn màu và kích thước' : 'Select color and size')
              ) : selectedVariant?.quantity === 0 ? (
                (lang === 'vi' ? 'Hết hàng' : 'Out of Stock')
              ) : (
                (lang === 'vi' ? 'Thêm vào giỏ hàng' : 'Add to Cart')
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
