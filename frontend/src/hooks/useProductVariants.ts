import { useState, useEffect, useRef } from 'react'
import { productApi, ProductVariant } from '@/services/productApi'

interface VariantsCache {
  sizes: string[]
  variants: ProductVariant[]
}

const variantsCache = new Map<string, VariantsCache>()

export function useProductVariants(slug: string) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!slug) return

    // Return from cache if available
    if (variantsCache.has(slug)) {
      setVariants(variantsCache.get(slug)!.variants)
      return
    }

    // Skip if already fetched in this instance
    if (fetchedRef.current) return

    fetchedRef.current = true
    setLoading(true)

    productApi.getProductBySlug(slug)
      .then((res) => {
        const productVariants: ProductVariant[] = res.data?.variants || []
        variantsCache.set(slug, {
          sizes: [...new Set(productVariants.map(v => v.size))],
          variants: productVariants,
        })
        setVariants(productVariants)
      })
      .catch((err) => {
        console.error('Failed to fetch variants:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  const sizes = [...new Set(variants.map(v => v.size))].sort((a, b) => {
    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    const indexA = order.indexOf(a.toUpperCase())
    const indexB = order.indexOf(b.toUpperCase())
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })

  return { variants, sizes, loading }
}
