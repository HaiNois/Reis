import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import { categoryApi, productApi, Category, Product } from '@/services/productApi'
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
import { Pencil, Trash2, Package, Plus, Search } from 'lucide-react'

// Define columns for categories table
const categoryColumns = (t: Function, openProductModal: (category: Category) => void, openEdit: (category: Category) => void, handleDelete: (id: string) => void): ColumnDef<Category>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        {row.original.nameEn && (
          <div className="text-sm text-muted-foreground">{row.original.nameEn}</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.slug}</span>,
  },
  {
    accessorKey: 'productCount',
    header: t('admin.products'),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.productCount ?? 0}</span>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => openProductModal(row.original)}>
          <Package className="h-4 w-4 mr-1" />
          {t('common.products')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)} className="text-red-600 hover:text-red-800">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]

export default function CategoriesPage() {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryProductIds, setCategoryProductIds] = useState<Set<string>>(new Set())
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    slug: '',
    description: '',
    descriptionEn: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      handleApiError(error, t('admin.failedFetchCategories'))
    } finally {
      setLoading(false)
    }
  }

  const openProductModal = async (category: Category) => {
    setSelectedCategory(category)
    setShowProductModal(true)
    setLoadingProducts(true)
    setProductSearch('')
    try {
      // Fetch products already in this category
      const categoryProductsRes = await categoryApi.getCategoryProducts(category.id)
      const categoryProducts = categoryProductsRes.data || []
      setCategoryProductIds(new Set(categoryProducts.map((p: Product) => p.id)))

      // Fetch all available products for selection
      const allProductsRes = await productApi.getAdminProducts({ limit: 100 })
      setAvailableProducts(allProductsRes.data || [])
    } catch (error) {
      handleApiError(error, t('admin.failedFetchProducts'))
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.id, formData)
        showToast.success(t('admin.categoryUpdated'))
      } else {
        await categoryApi.createCategory(formData)
        showToast.success(t('admin.categoryCreated'))
      }
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', nameEn: '', slug: '', description: '', descriptionEn: '' })
      fetchCategories()
    } catch (error) {
      handleApiError(error, t('admin.failedSaveCategory'))
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: t('admin.deleteCategory'),
      description: t('admin.deleteCategoryConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
    })
    if (!confirmed) return
    try {
      await categoryApi.deleteCategory(id)
      showToast.success(t('admin.categoryDeleted'))
      fetchCategories()
    } catch (error) {
      handleApiError(error, t('admin.failedDeleteCategory'))
    }
  }

  const openEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      nameEn: category.nameEn || '',
      slug: category.slug,
      description: category.description || '',
      descriptionEn: category.descriptionEn || '',
    })
    setShowModal(true)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const resetForm = () => {
    setEditingCategory(null)
    setFormData({ name: '', nameEn: '', slug: '', description: '', descriptionEn: '' })
  }

  const toggleProduct = (productId: string) => {
    const newSelectedIds = new Set(categoryProductIds)
    if (newSelectedIds.has(productId)) {
      newSelectedIds.delete(productId)
    } else {
      newSelectedIds.add(productId)
    }
    setCategoryProductIds(newSelectedIds)
  }

  const toggleSelectAll = () => {
    if (categoryProductIds.size === filteredProducts.length) {
      setCategoryProductIds(new Set())
    } else {
      setCategoryProductIds(new Set(filteredProducts.map((p) => p.id)))
    }
  }

  const handleAddSelectedProducts = async () => {
    if (!selectedCategory || categoryProductIds.size === 0) return

    try {
      const productIds = Array.from(categoryProductIds)
      await categoryApi.addProductsToCategory(selectedCategory.id, productIds)
      showToast.success(t('admin.productsAdded'))
      setShowProductModal(false)
    } catch (error) {
      handleApiError(error, t('admin.failedAddProduct'))
    }
  }

  const handleRemoveSelectedProducts = async () => {
    if (!selectedCategory || categoryProductIds.size === 0) return

    try {
      const productIds = Array.from(categoryProductIds)
      await categoryApi.removeProductsFromCategory(selectedCategory.id, productIds)
      showToast.success(t('admin.productsRemoved'))
      setShowProductModal(false)
    } catch (error) {
      handleApiError(error, t('admin.failedRemoveProduct'))
    }
  }

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.slug.toLowerCase().includes(productSearch.toLowerCase())
  )

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
          <CardTitle className="text-2xl font-bold">{t('admin.categories')}</CardTitle>
          <Button onClick={() => { resetForm(); setShowModal(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addCategory')}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={categoryColumns(t, openProductModal, openEdit, handleDelete)}
            data={categories}
            pageSize={10}
            onRowDoubleClick={(category) => openEdit(category as Category)}
          />
        </CardContent>
      </Card>

      {/* Category Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('admin.editCategory') : t('admin.addCategory')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('admin.categoryName')} *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: generateSlug(e.target.value)
                })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">{t('admin.categoryNameEn')}</Label>
              <Input
                id="nameEn"
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t('admin.slug')} *</Label>
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.description')}</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionEn">{t('admin.descriptionEn')}</Label>
              <textarea
                id="descriptionEn"
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Selection Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('admin.selectProducts')} - {selectedCategory?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('admin.searchProducts')}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected count */}
          <div className="text-sm text-muted-foreground">
            {categoryProductIds.size} {t('admin.productsSelected')}
          </div>

          {/* Products List */}
          {loadingProducts ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" className="text-black" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left w-10">
                      <input
                        type="checkbox"
                        checked={categoryProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">{t('admin.product')}</th>
                    <th className="px-3 py-2 text-left">{t('admin.status')}</th>
                    <th className="px-3 py-2 text-right">{t('admin.price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const isSelected = categoryProductIds.has(product.id)
                    return (
                      <tr
                        key={product.id}
                        className={`border-t cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-green-50' : ''}`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProduct(product.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                       <td className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            {product.images?.[0]?.publicUrl || product.image ? (
                              <img
                                src={product.images?.[0]?.publicUrl || product.image}
                                alt=""
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded" />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={product.status === 'ACTIVE' ? 'default' : 'outline'} className={product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(product.price).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    )
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                        {t('admin.noProductsFound')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-4">
            <span className="text-sm text-muted-foreground self-center">
              {categoryProductIds.size} {t('admin.productsSelected')}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowProductModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveSelectedProducts}
                disabled={categoryProductIds.size === 0}
              >
                {t('admin.removeSelectedProducts')}
              </Button>
              <Button onClick={handleAddSelectedProducts} disabled={categoryProductIds.size === 0}>
                {t('admin.addSelectedProducts')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}