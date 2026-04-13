import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { productApi, categoryApi, Product, ProductVariant, Category } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-react'
import { ColorPicker } from '@/components/ui/color-picker'
import { SizePicker } from '@/components/ui/size-picker'
import { ImageUpload } from '@/components/ui/image-upload'

function generateSku(productSlug: string, color: string, size: string): string {
  const slugPart = productSlug.substring(0, 6).toUpperCase().replace(/-/g, '')
  const colorPart = color.substring(0, 4).toUpperCase().replace(/\s+/g, '')
  const sizePart = size.toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${slugPart}-${colorPart}-${sizePart}-${random}`
}

export default function ProductDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    material: '',
    careGuide: '',
    price: 0,
    compareAtPrice: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
    images: '',
    categoryId: '',
  })
  const [saving, setSaving] = useState(false)

  // Variant modal state
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantForm, setVariantForm] = useState({
    sku: '',
    size: '',
    color: '',
    price: 0,
    salePrice: 0,
    quantity: 0,
  })

  const isFormValid = formData.name.trim().length > 0 &&
    formData.slug.trim().length > 0 &&
    formData.price > 0

  useEffect(() => {
    fetchCategories()
    if (id && id !== 'new') {
      fetchProduct(id)
    } else {
      setLoading(false)
    }
  }, [id])

  // Auto-generate SKU when size or color changes
  useEffect(() => {
    if ((variantForm.size || variantForm.color) && product) {
      const newSku = generateSku(product.slug, variantForm.color, variantForm.size)
      setVariantForm(prev => ({ ...prev, sku: newSku }))
    }
  }, [variantForm.size, variantForm.color, product])

  // Set default price from product when product changes
  useEffect(() => {
    if (product && variantForm.price === 0) {
      setVariantForm(prev => ({ ...prev, price: product.price }))
    }
  }, [product, variantForm.price])

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories', error)
    }
  }

  const fetchProduct = async (productId: string) => {
    try {
      const response = await productApi.getProductById(productId)
      const productData = response.data
      setProduct(productData)

      // Extract image URLs - image field is a JSON string, images array is for ProductImage objects
      let imageUrls: string[] = []

      // First try: parse image field (JSON string of URLs)
      if (productData.image) {
        try {
          const parsed = JSON.parse(productData.image)
          if (Array.isArray(parsed)) {
            imageUrls = parsed.filter(Boolean)
          }
        } catch {
          // If not JSON, treat as single URL
          imageUrls = [productData.image].filter(Boolean)
        }
      }

      // Second try: images array (ProductImage objects with publicUrl)
      if (imageUrls.length === 0 && productData.images && Array.isArray(productData.images)) {
        imageUrls = productData.images
          .map((img: { publicUrl?: string; url?: string }) => img.publicUrl || img.url || '')
          .filter(Boolean)
      }

      setFormData({
        name: productData.name,
        slug: productData.slug,
        description: productData.description || '',
        material: productData.material || '',
        careGuide: productData.careGuide || '',
        price: Number(productData.price) || 0,
        compareAtPrice: Number(productData.compareAtPrice) || 0,
        status: productData.status,
        images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : '',
        categoryId: productData.categoryId || '',
      })
    } catch (error) {
      handleApiError(error, 'Failed to fetch product')
      navigate('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Parse images JSON string - API expects 'image' field as JSON string
      const imagesArray = formData.images ? JSON.parse(formData.images) : []
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        material: formData.material,
        careGuide: formData.careGuide,
        price: formData.price,
        compareAtPrice: formData.compareAtPrice || undefined,
        status: formData.status,
        image: imagesArray.length > 0 ? JSON.stringify(imagesArray) : undefined,
        categoryId: formData.categoryId || undefined,
      }
      if (product) {
        await productApi.updateProduct(product.id, payload)
        showToast.success(t('admin.productSaved') || 'Product updated successfully')
      } else {
        const response = await productApi.createProduct(payload)
        showToast.success(t('admin.productSaved') || 'Product created successfully')
        navigate(`/admin/products/${response.data.id}`)
      }
    } catch (error) {
      handleApiError(error, 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const openVariantModal = (variant?: ProductVariant) => {
    if (variant) {
      setEditingVariant(variant)
      setVariantForm({
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        price: variant.price,
        salePrice: variant.salePrice || 0,
        quantity: variant.quantity || 0,
      })
    } else {
      setEditingVariant(null)
      setVariantForm({
        sku: '',
        size: '',
        color: '',
        price: product?.price || 0,
        salePrice: 0,
        quantity: 0,
      })
    }
    setShowVariantModal(true)
  }

  const handleSaveVariant = async () => {
    if (!product || !variantForm.size || !variantForm.color) {
      showToast.error('Please fill required fields')
      return
    }
    try {
      const variantData = {
        sku: variantForm.sku,
        size: variantForm.size,
        color: variantForm.color,
        price: Number(variantForm.price),
        salePrice: variantForm.salePrice ? Number(variantForm.salePrice) : undefined,
        quantity: variantForm.quantity,
      }
      if (editingVariant) {
        await productApi.updateVariant(product.id, editingVariant.id, variantData)
        showToast.success(t('admin.variantSaved') || 'Variant updated')
      } else {
        await productApi.createVariant(product.id, variantData)
        showToast.success(t('admin.variantSaved') || 'Variant created')
      }
      setShowVariantModal(false)
      fetchProduct(product.id)
    } catch (error) {
      handleApiError(error, 'Failed to save variant')
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: t('admin.variantDelete') || 'Delete Variant',
      description: t('admin.confirmDelete'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
    })
    if (!confirmed || !product) return
    try {
      await productApi.deleteVariant(product.id, variantId)
      showToast.success(t('admin.variantDeleted') || 'Variant deleted')
      fetchProduct(product.id)
    } catch (error) {
      handleApiError(error, 'Failed to delete variant')
    }
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('admin.backToProducts')}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {product ? formData.name || t('admin.editProduct') : t('admin.addProduct')}
          </h1>
          {product && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={
                formData.status === 'ACTIVE' ? 'default' :
                formData.status === 'DRAFT' ? 'secondary' : 'outline'
              }>
                {formData.status === 'ACTIVE' ? t('admin.productActive') :
                 formData.status === 'DRAFT' ? t('admin.productDraft') :
                 t('admin.productArchived')}
              </Badge>
              <span className="text-sm text-muted-foreground">{product.slug}</span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">{t('admin.basicInfo')}</TabsTrigger>
          <TabsTrigger value="variants">
            {t('admin.variants')}
            {product?.variants && product.variants.length > 0 && (
              <Badge variant="secondary" className="ml-2">{product.variants.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>{t('admin.productImages')}</Label>
                  <ImageUpload
                    value={formData.images}
                    onChange={(url) => setFormData({ ...formData, images: url })}
                    multiple={true}
                    maxImages={10}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('admin.productName')} *</Label>
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
                    <Label htmlFor="slug">{t('admin.slug')} *</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('product.price')} (VND) *</Label>
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
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v as 'ACTIVE' | 'DRAFT' | 'ARCHIVED' })}
                    >
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
                  <Select
                    value={formData.categoryId || ''}
                    onValueChange={(v) => setFormData({ ...formData, categoryId: v || '' })}
                  >
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
                  <Button variant="outline" type="button" onClick={() => navigate('/admin/products')}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={!isFormValid || saving}>
                    {saving ? t('common.processing') : t('common.save')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('admin.variants')}</CardTitle>
              <Button onClick={() => openVariantModal()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.variantAdd')}
              </Button>
            </CardHeader>
            <CardContent>
              {product?.variants && product.variants.length > 0 ? (
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
                      {product.variants.map((variant) => (
                        <tr key={variant.id} className="border-t hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs">{variant.sku}</td>
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
                                onClick={() => openVariantModal(variant)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVariant(variant.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>{t('admin.variantNone')}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => openVariantModal()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.variantAdd')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Variant Modal */}
      <Dialog open={showVariantModal} onOpenChange={setShowVariantModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? t('admin.variantEdit') : t('admin.variantAdd')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sku">{t('admin.variantSku')} *</Label>
                <Input
                  id="sku"
                  value={variantForm.sku}
                  disabled={!!editingVariant}
                  className={editingVariant ? 'bg-gray-100 cursor-not-allowed' : ''}
                  placeholder="Auto-generated"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantColor">{t('admin.variantColor')} *</Label>
                <ColorPicker
                  value={variantForm.color}
                  onChange={(color) => setVariantForm({ ...variantForm, color })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantSize">{t('admin.variantSize')} *</Label>
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
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantSalePrice">{t('admin.variantSalePrice')}</Label>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVariantModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveVariant}>
                {editingVariant ? t('common.save') : t('admin.variantAdd')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
