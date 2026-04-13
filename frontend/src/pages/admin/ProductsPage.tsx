import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import { productApi, categoryApi, Product, Category } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, Plus, Search, Image as ImageIcon, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

// Define columns for products table
const productColumns = (
  t: Function,
  navigate: (id: string) => void,
  handleDelete: (id: string) => void
): ColumnDef<Product>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: () => <div className="font-semibold">{t('admin.productName')}</div>,
    cell: ({ row }) => {
      // Get preview image from images array (can be string[] or object[])
      const images = row.original.images || []
      let previewUrl = ''

      if (images.length > 0) {
        // Handle both string[] and object[] formats
        const firstImage = images[0]
        if (typeof firstImage === 'string') {
          previewUrl = firstImage
        } else if (firstImage && typeof firstImage === 'object' && 'publicUrl' in firstImage) {
          // Find primary image first, then fallback to first image
          const imgObj = firstImage as any
          const primary = images.find((img: any) => img.isPrimary)
          previewUrl = primary?.publicUrl || imgObj.publicUrl
        }
      }

      // Fallback to legacy image field (may be JSON string or plain string)
      if (!previewUrl && row.original.image) {
        if (typeof row.original.image === 'string') {
          try {
            // Try parsing as JSON array
            const parsed = JSON.parse(row.original.image)
            previewUrl = Array.isArray(parsed) ? parsed[0] : row.original.image
          } catch {
            previewUrl = row.original.image
          }
        }
      }

      return (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(row.original.id)}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={row.original.name}
              className="w-10 h-10 object-cover rounded border"
            />
          ) : (
            <div className="w-10 h-10 rounded border bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.slug}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'price',
    header: () => <div className="font-semibold">{t('product.price')}</div>,
    cell: ({ row }) => (
      <span className="font-medium">{Number(row.original.price).toLocaleString('vi-VN')} ₫</span>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <div className="font-semibold">{t('admin.productStatus')}</div>,
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={
          status === 'ACTIVE' ? 'default' :
          status === 'DRAFT' ? 'secondary' :
          'outline'
        } className={
          status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
          status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
          ''
        }>
          {status === 'ACTIVE' ? t('admin.productActive') :
           status === 'DRAFT' ? t('admin.productDraft') :
           t('admin.productArchived')}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'category',
    header: () => <div className="font-semibold">{t('admin.productCategory')}</div>,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.category?.name || t('admin.productNoCategory')}
      </span>
    ),
  },
  {
    id: 'variants',
    header: () => <div className="font-semibold text-center">{t('admin.productVariants')}</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Badge variant="secondary">
          {row.original.variants?.length || 0}
        </Badge>
      </div>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right font-semibold">{t('admin.productActions')}</div>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate(row.original.id)}>
          <Pencil className="h-4 w-4 mr-1" />
          {t('common.edit')}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
          <Trash2 className="h-4 w-4 mr-1" />
          {t('common.delete')}
        </Button>
      </div>
    ),
  },
]

export default function ProductsPage() {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [bulkStatus, setBulkStatus] = useState<string>('')

  // Filtered products based on search, status and category
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        if (!p.name.toLowerCase().includes(query) &&
            !p.slug.toLowerCase().includes(query) &&
            !p.category?.name?.toLowerCase().includes(query)) {
          return false
        }
      }
      // Status filter
      if (statusFilter !== 'ALL' && p.status !== statusFilter) {
        return false
      }
      // Category filter
      if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter) {
        return false
      }
      return true
    })
  }, [products, searchQuery, statusFilter, categoryFilter])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productApi.getProducts({ limit: 100 })
      setProducts(response.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: t('common.delete'),
      description: t('admin.confirmDelete'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
    })
    if (!confirmed) return
    try {
      const response = await productApi.deleteProduct(id)
      showToast.success(response.data?.message || 'Product deleted successfully')
      fetchProducts()
    } catch (error) {
      handleApiError(error, 'Failed to delete product')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return
    const confirmed = await confirm({
      type: 'warning',
      title: t('admin.bulkDelete'),
      description: t('admin.bulkDeleteConfirm', { count: selectedProducts.length }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
    })
    if (!confirmed) return
    try {
      await Promise.all(selectedProducts.map(p => productApi.deleteProduct(p.id)))
      showToast.success(t('admin.bulkDeleted') || `${selectedProducts.length} products deleted`)
      setSelectedProducts([])
      fetchProducts()
    } catch (error) {
      handleApiError(error, 'Failed to delete products')
    }
  }

  const handleBulkStatusChange = async () => {
    if (selectedProducts.length === 0 || !bulkStatus) return
    try {
      await Promise.all(selectedProducts.map(p =>
        productApi.updateProduct(p.id, { status: bulkStatus as 'ACTIVE' | 'DRAFT' | 'ARCHIVED' })
      ))
      showToast.success(t('admin.bulkStatusChanged') || `${selectedProducts.length} products updated`)
      setSelectedProducts([])
      setBulkStatus('')
      fetchProducts()
    } catch (error) {
      handleApiError(error, 'Failed to update products')
    }
  }

  const clearSelection = () => {
    setSelectedProducts([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">{t('admin.products')}</CardTitle>
          <Button onClick={() => navigate('new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addProduct')}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('admin.productStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('admin.productAllStatus')}</SelectItem>
                <SelectItem value="ACTIVE">{t('admin.productActive')}</SelectItem>
                <SelectItem value="DRAFT">{t('admin.productDraft')}</SelectItem>
                <SelectItem value="ARCHIVED">{t('admin.productArchived')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('admin.productCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('admin.productAllCategories')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4 text-sm">
            <span className="text-muted-foreground">
              {filteredProducts.length} / {products.length} {t('admin.products').toLowerCase()}
            </span>
          </div>

          {/* Bulk Action Bar */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
              <span className="text-sm font-medium">
                {selectedProducts.length} {t('admin.productsSelected')}
              </span>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('admin.changeStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t('admin.productActive')}</SelectItem>
                  <SelectItem value="DRAFT">{t('admin.productDraft')}</SelectItem>
                  <SelectItem value="ARCHIVED">{t('admin.productArchived')}</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleBulkStatusChange} disabled={!bulkStatus}>
                {t('admin.applyStatus')}
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                {t('common.delete')}
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X className="h-4 w-4 mr-1" />
                {t('common.clear')}
              </Button>
            </div>
          )}

          <DataTable
            columns={productColumns(t, (id) => navigate(id), handleDelete)}
            data={filteredProducts}
            pageSize={10}
            enableRowSelection={true}
            onSelectionChange={setSelectedProducts}
          />
        </CardContent>
      </Card>
    </div>
  )
}
