import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import { productApi, categoryApi, Product, ProductVariant, Category } from '@/services/productApi'
import { ImageUpload } from '@/components/ui/image-upload'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, Plus, Search, Image as ImageIcon } from 'lucide-react'
import { ColorPicker } from '@/components/ui/color-picker'
import { SizePicker } from '@/components/ui/size-picker'

// Generate SKU from product slug + color + size
function generateSku(productSlug: string, color: string, size: string): string {
  const slugPart = productSlug.substring(0, 6).toUpperCase().replace(/-/g, '')
  const colorPart = color.substring(0, 4).toUpperCase().replace(/\s+/g, '')
  const sizePart = size.toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${slugPart}-${colorPart}-${sizePart}-${random}`
}

// Define columns for products table
const productColumns = (
  t: Function,
  openEdit: (product: Product) => void,
  handleDelete: (id: string) => void,
  openVariantModal: (product: Product) => void
): ColumnDef<Product>[] => [
  {
    accessorKey: 'name',
    header: () => <div className="font-semibold">{t('admin.productName')}</div>,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.image ? (
          <img
            src={row.original.image}
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
    ),
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
    accessorKey: 'variants',
    header: () => <div className="font-semibold text-center">{t('admin.productVariants')}</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
          {row.original.variants?.length || 0}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openVariantModal(row.original)}
          title={t('admin.productVariants')}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right font-semibold">{t('admin.productActions')}</div>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => openEdit(row.original)}>
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
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    material: '',
    careGuide: '',
    price: 0,
    compareAtPrice: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
    image: '',
    categoryId: '',
  })

  // Variant form
  const [variantForm, setVariantForm] = useState({
    sku: '',
    size: '',
    color: '',
    price: 0,
    salePrice: 0,
    quantity: 0,
  })

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const query = searchQuery.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.slug.toLowerCase().includes(query) ||
      p.category?.name?.toLowerCase().includes(query)
    )
  }, [products, searchQuery])

  // Auto-generate SKU when size or color changes
  useEffect(() => {
    if ((variantForm.size || variantForm.color) && editingProduct) {
      const newSku = generateSku(editingProduct.slug, variantForm.color, variantForm.size)
      setVariantForm(prev => ({ ...prev, sku: newSku }))
    }
  }, [variantForm.size, variantForm.color, editingProduct])

  // Set default price from product when product changes
  useEffect(() => {
    if (editingProduct && variantForm.price === 0) {
      setVariantForm(prev => ({ ...prev, price: editingProduct.price }))
    }
  }, [editingProduct, variantForm.price])

  // Form validation
  const isFormValid = formData.name.trim().length > 0 &&
    formData.slug.trim().length > 0 &&
    formData.price > 0

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId || undefined,
      }
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, payload)
        showToast.success(t('admin.productSaved') || 'Product updated successfully')
      } else {
        await productApi.createProduct(payload)
        showToast.success(t('admin.productSaved') || 'Product created successfully')
      }
      setShowProductDialog(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        slug: '',
        description: '',
        material: '',
        careGuide: '',
        price: 0,
        compareAtPrice: 0,
        status: 'ACTIVE',
        image: '',
        categoryId: '',
      })
      fetchProducts()
    } catch (error) {
      handleApiError(error, 'Failed to save product')
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

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      material: product.material || '',
      careGuide: product.careGuide || '',
      price: product.price,
      compareAtPrice: product.compareAtPrice || 0,
      status: product.status,
      image: product.image || '',
      categoryId: product.categoryId || '',
    })
    setShowProductDialog(true)
  }

  const openVariantModal = (product: Product) => {
    setEditingProduct(product)
    setEditingVariant(null)
    setVariantForm({
      sku: '',
      size: '',
      color: '',
      price: product.price,
      salePrice: 0,
      quantity: 0,
    })
    setShowVariantModal(true)
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      material: '',
      careGuide: '',
      price: 0,
      compareAtPrice: 0,
      status: 'ACTIVE',
      image: '',
      categoryId: '',
    })
    setVariantForm({
      sku: '',
      size: '',
      color: '',
      price: 0,
      salePrice: 0,
      quantity: 0,
    })
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
          <Button onClick={() => { resetForm(); setShowProductDialog(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addProduct')}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4 text-sm">
            <span className="text-muted-foreground">
              {filteredProducts.length} / {products.length} {t('admin.products').toLowerCase()}
            </span>
          </div>

          <DataTable
            columns={productColumns(t, openEdit, handleDelete, openVariantModal)}
            data={filteredProducts}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t('admin.editProduct') : t('admin.addProduct')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Image Preview */}
            {formData.image && (
              <div className="mb-4">
                <Label>{t('admin.productImages')}</Label>
                <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-48 object-contain rounded"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('admin.productName')}</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">{t('admin.slug')}</Label>
                <Input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.description')}</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('admin.productImages')}</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                multiple={true}
                maxImages={10}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t('product.price')} (VND)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">{t('admin.productCompareAtPrice')}</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material">{t('admin.productMaterial')}</Label>
                <Input
                  id="material"
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t('admin.productStatus')}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('admin.productActive')}</SelectItem>
                    <SelectItem value="DRAFT">{t('admin.productDraft')}</SelectItem>
                    <SelectItem value="ARCHIVED">{t('admin.productArchived')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('admin.productCategory')}</Label>
              <Select value={formData.categoryId || ''} onValueChange={(v) => setFormData({ ...formData, categoryId: v || '' })}>
                <SelectTrigger id="category">
                  <SelectValue placeholder={t('admin.productNoCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="none" disabled>{t('admin.productNoCategory')}</SelectItem>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="careGuide">{t('admin.productCareGuide')}</Label>
              <textarea
                id="careGuide"
                value={formData.careGuide}
                onChange={(e) => setFormData({ ...formData, careGuide: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => setShowProductDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={!isFormValid}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Variant Modal */}
      <Dialog open={showVariantModal} onOpenChange={setShowVariantModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? t('admin.variantEdit') : t('admin.variantAdd')} - {editingProduct?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Add/Edit Variant Form */}
          <div className="border rounded-lg p-4 mb-4 mt-4">
            <h4 className="font-medium mb-3">
              {editingVariant ? t('admin.variantEdit') : t('admin.variantAdd')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sku">{t('admin.variantSku')}</Label>
                <Input
                  id="sku"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="e.g., TSHIRT-S-M"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantColor">{t('admin.variantColor')}</Label>
                <ColorPicker
                  value={variantForm.color}
                  onChange={(color) => setVariantForm({ ...variantForm, color })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantSize">{t('admin.variantSize')}</Label>
                <SizePicker
                  value={variantForm.size}
                  onChange={(size) => setVariantForm({ ...variantForm, size })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantPrice">{t('admin.variantPrice')} (VND)</Label>
                <Input
                  id="variantPrice"
                  type="number"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantSalePrice">{t('admin.variantSalePrice')} (VND)</Label>
                <Input
                  id="variantSalePrice"
                  type="number"
                  value={variantForm.salePrice}
                  onChange={(e) => setVariantForm({ ...variantForm, salePrice: Number(e.target.value) })}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">{t('admin.variantQuantity')}</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={variantForm.quantity}
                  onChange={(e) => setVariantForm({ ...variantForm, quantity: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setEditingVariant(null)
                  setVariantForm({ sku: '', size: '', color: '', price: editingProduct?.price || 0, salePrice: 0, quantity: 0 })
                }}
              >
                {t('admin.variantClear')}
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!editingProduct || !variantForm.sku || !variantForm.size || !variantForm.color) {
                    showToast.error('Please fill required fields')
                    return
                  }
                  try {
                    const variantData = {
                      sku: variantForm.sku,
                      size: variantForm.size,
                      color: variantForm.color,
                      price: variantForm.price,
                      salePrice: variantForm.salePrice || undefined,
                      quantity: variantForm.quantity,
                    }
                    if (editingVariant) {
                      await productApi.updateVariant(editingVariant.id, variantData)
                      showToast.success(t('admin.variantSaved') || 'Variant updated')
                    } else {
                      await productApi.createVariant(editingProduct.id, variantData)
                      showToast.success(t('admin.variantSaved') || 'Variant created')
                    }
                    setVariantForm({ sku: '', size: '', color: '', price: editingProduct?.price || 0, salePrice: 0, quantity: 0 })
                    setEditingVariant(null)
                    fetchProducts()
                  } catch (error) {
                    handleApiError(error, 'Failed to save variant')
                  }
                }}
              >
                {editingVariant ? t('common.save') : t('admin.variantAdd')}
              </Button>
            </div>
          </div>

          {/* Variants List */}
          <div>
            <h4 className="font-medium mb-2">{t('admin.variantCurrent')}</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">{t('admin.variantSku')}</th>
                    <th className="px-3 py-2 text-left font-semibold">{t('admin.variantColor')}</th>
                    <th className="px-3 py-2 text-left font-semibold">{t('admin.variantSize')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('admin.variantPrice')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('admin.variantSalePrice')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('admin.variantQuantity')}</th>
                    <th className="px-3 py-2 text-center font-semibold">{t('admin.productActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {editingProduct?.variants?.map((variant) => (
                    <tr key={variant.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{variant.sku}</td>
                      <td className="px-3 py-2">{variant.color}</td>
                      <td className="px-3 py-2">{variant.size}</td>
                      <td className="px-3 py-2 text-right">{Number(variant.price).toLocaleString('vi-VN')} ₫</td>
                      <td className="px-3 py-2 text-right">
                        {variant.salePrice && variant.salePrice > 0
                          ? `${Number(variant.salePrice).toLocaleString('vi-VN')} ₫`
                          : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">{variant.quantity}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingVariant(variant)
                              setVariantForm({
                                sku: variant.sku,
                                size: variant.size,
                                color: variant.color,
                                price: variant.price,
                                salePrice: variant.salePrice || 0,
                                quantity: variant.quantity || 0,
                              })
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const confirmed = await confirm({
                                type: 'warning',
                                title: t('admin.variantDelete') || 'Delete Variant',
                                description: t('admin.confirmDelete'),
                                confirmText: t('common.delete'),
                                cancelText: t('common.cancel'),
                              })
                              if (confirmed) {
                                try {
                                  await productApi.deleteVariant(variant.id)
                                  showToast.success(t('admin.variantDeleted') || 'Variant deleted')
                                  fetchProducts()
                                } catch (error) {
                                  handleApiError(error, 'Failed to delete variant')
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!editingProduct?.variants || editingProduct.variants.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        {t('admin.variantNone')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
