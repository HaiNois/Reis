import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import { productApi, Product, ProductVariant } from '@/services/productApi'
import { ImageUpload } from '@/components/ui/image-upload'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, Plus } from 'lucide-react'

// Define columns for products table
const productColumns = (
  t: Function,
  openEdit: (product: Product) => void,
  handleDelete: (id: string) => void,
  openVariantModal: (product: Product) => void
): ColumnDef<Product>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-sm text-muted-foreground">{row.original.slug}</div>
      </div>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => (
      <span className="font-medium">{Number(row.original.price).toLocaleString('vi-VN')} ₫</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
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
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'variants',
    header: 'Variants',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.original.variants?.length || 0}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openVariantModal(row.original)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
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
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
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

  // Form validation
  const isFormValid = formData.name.trim().length > 0 &&
    formData.slug.trim().length > 0 &&
    formData.price > 0

  useEffect(() => {
    fetchProducts()
  }, [])

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
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, formData)
        showToast.success('Product updated successfully')
      } else {
        await productApi.createProduct(formData)
        showToast.success('Product created successfully')
      }
      setShowModal(false)
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
      })
      fetchProducts()
    } catch (error) {
      handleApiError(error, 'Failed to save product')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: 'Delete Product',
      description: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
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
    })
    setShowModal(true)
  }

  const openVariantModal = (product: Product) => {
    setEditingProduct(product)
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
          <Button onClick={() => { resetForm(); setShowModal(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addProduct')}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={productColumns(t, openEdit, handleDelete, openVariantModal)}
            data={products}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t('admin.editProduct') : t('admin.addProduct')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
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
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                multiple={true}
                maxImages={10}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (VND)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare Price</Label>
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
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="careGuide">Care Guide</Label>
              <textarea
                id="careGuide"
                value={formData.careGuide}
                onChange={(e) => setFormData({ ...formData, careGuide: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
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
              Manage Variants - {editingProduct?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Add Variant Form */}
          <div className="border rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3">{editingVariant ? 'Edit Variant' : 'Add New Variant'}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="e.g., TSHIRT-S-M"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={variantForm.color}
                  onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                  placeholder="e.g., Black, White"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={variantForm.size}
                  onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                  placeholder="e.g., S, M, L, XL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantPrice">Price</Label>
                <Input
                  id="variantPrice"
                  type="number"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price</Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={variantForm.salePrice}
                  onChange={(e) => setVariantForm({ ...variantForm, salePrice: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
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
                  setVariantForm({ sku: '', size: '', color: '', price: 0, salePrice: 0, quantity: 0 })
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!editingProduct || !variantForm.sku || !variantForm.size || !variantForm.color) {
                    showToast.error('Please fill required fields')
                    return
                  }
                  try {
                    if (editingVariant) {
                      await productApi.updateVariant(editingVariant.id, variantForm)
                      showToast.success('Variant updated')
                    } else {
                      await productApi.createVariant(editingProduct.id, variantForm)
                      showToast.success('Variant created')
                    }
                    setVariantForm({ sku: '', size: '', color: '', price: 0, salePrice: 0, quantity: 0 })
                    setEditingVariant(null)
                    fetchProducts()
                  } catch (error) {
                    handleApiError(error, 'Failed to save variant')
                  }
                }}
              >
                {editingVariant ? 'Update' : 'Add'} Variant
              </Button>
            </div>
          </div>

          {/* Variants List */}
          <div>
            <h4 className="font-medium mb-2">Current Variants</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Color</th>
                    <th className="px-3 py-2 text-left">Size</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {editingProduct?.variants?.map((variant) => (
                    <tr key={variant.id} className="border-t">
                      <td className="px-3 py-2">{variant.sku}</td>
                      <td className="px-3 py-2">{variant.color}</td>
                      <td className="px-3 py-2">{variant.size}</td>
                      <td className="px-3 py-2 text-right">
                        {Number(variant.price).toLocaleString('vi-VN')} ₫
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
                                quantity: variant.quantity,
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
                                title: 'Delete Variant',
                                description: 'Are you sure you want to delete this variant?',
                                confirmText: 'Delete',
                                cancelText: 'Cancel',
                              })
                              if (confirmed) {
                                try {
                                  await productApi.deleteVariant(variant.id)
                                  showToast.success('Variant deleted')
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
                      <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                        No variants yet
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