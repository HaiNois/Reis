import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import { productApi, Product } from '@/services/productApi'
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
const productColumns = (t: Function, openEdit: (product: Product) => void, handleDelete: (id: string) => void): ColumnDef<Product>[] => [
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
    cell: ({ row }) => <span>{row.original.variants?.length || 0} variants</span>,
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
            columns={productColumns(t, openEdit, handleDelete)}
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
    </div>
  )
}