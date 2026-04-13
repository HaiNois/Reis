import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { homepageSectionApi, HomepageSectionType, HomepageSectionProduct } from '@/services/homepageApi'
import { productApi, Product, Collection, collectionApi } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SECTION_TYPES: { value: HomepageSectionType; label: string; labelVi: string; icon: string }[] = [
  { value: 'ANNOUNCEMENT_BAR', label: 'Announcement Bar', labelVi: 'Thanh thông báo', icon: '📢' },
  { value: 'HERO', label: 'Hero', labelVi: 'Banner chính', icon: '🖼️' },
  { value: 'PRODUCT_RAIL', label: 'Product Rail', labelVi: 'Danh sách sản phẩm', icon: '👕' },
  { value: 'MEDIA_TILES', label: 'Media Tiles', labelVi: 'Ô hình ảnh', icon: '🖼️' },
]

// ============ SWITCH COMPONENT ============
function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-black" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

// ============ PREVIEW SECTION COMPONENT ============
function PreviewContent({ sectionType, formData }: { sectionType: string; formData: any }) {
  if (sectionType === 'HERO') {
    return (
      <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={formData.mediaUrl || 'https://via.placeholder.com/800x400?text=Hero+Image'}
          alt="Hero preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-white text-xl font-bold">{formData.title || 'Tiêu đề'}</h3>
          {formData.ctaLabel && (
            <span className="inline-block mt-2 px-4 py-2 border border-white text-white text-sm">
              {formData.ctaLabel}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (sectionType === 'ANNOUNCEMENT_BAR') {
    return (
      <div className="bg-black text-white text-center py-3 rounded-lg">
        <p className="text-sm">{formData.title || 'Thông báo'}</p>
      </div>
    )
  }

  if (sectionType === 'PRODUCT_RAIL') {
    return (
      <div className="space-y-3">
        <h3 className="font-bold">{formData.title || 'Sản phẩm'}</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-32 aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              <div className="w-full h-3/4 bg-gray-200" />
              <div className="p-2">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (sectionType === 'MEDIA_TILES') {
    return (
      <div className="space-y-3">
        <h3 className="font-bold">{formData.title || 'Bộ sưu tập'}</h3>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden">
              <div className="w-full h-3/4 bg-gray-200" />
              <div className="p-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <p className="text-gray-500">Preview not available for this section type</p>
}

export default function SectionFormPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const lang = i18n.language || 'vi'
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [editingItem, setEditingItem] = useState<any>(null)
  const [productSearch, setProductSearch] = useState('')
  const [collectionSearch, setCollectionSearch] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Track unsaved changes
  const [isDirty, setIsDirty] = useState(false)

  // Filter products by search term
  const filteredProducts = productSearch
    ? availableProducts.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.nameEn?.toLowerCase().includes(productSearch.toLowerCase())
      )
    : availableProducts

  // Filter collections by search term
  const filteredCollections = collectionSearch
    ? availableCollections.filter(c =>
        c.name.toLowerCase().includes(collectionSearch.toLowerCase())
      )
    : availableCollections

  const [formData, setFormData] = useState({
    sectionType: 'HERO' as HomepageSectionType,
    slug: '',
    title: '',
    subtitle: '',
    layout: 'grid' as string,
    configJson: {} as Record<string, unknown>,
    isActive: true,
    sortOrder: 0,
    startsAt: '',
    endsAt: '',
    // Item fields
    mediaUrl: '',
    ctaLabel: '',
    ctaUrl: '',
    selectedProductIds: [] as string[],
    selectedCollectionIds: [] as string[],
  })

  // Mark dirty when form changes
  const updateFormData = useCallback((updater: (prev: typeof formData) => typeof formData) => {
    setFormData(prev => {
      const newData = updater(prev)
      return newData
    })
    setIsDirty(true)
  }, [])

  // Fetch collections, products and section data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collections, products] = await Promise.all([
          collectionApi.getAllCollections(),
          productApi.getProducts({ limit: 100 }),
        ])
        setAvailableCollections(collections || [])
        setAvailableProducts(products || [])

        // Fetch section data if editing
        if (id) {
          const section = await homepageSectionApi.getSectionById(id)

          // Get first item if exists
          const firstItem = section.items?.[0] || null
          setEditingItem(firstItem)

          // Parse metaJson from item
          let metaJson: Record<string, unknown> = {}
          if (firstItem?.metaJson) {
            if (typeof firstItem.metaJson === 'string') {
              try {
                metaJson = JSON.parse(firstItem.metaJson)
              } catch {
                metaJson = {}
              }
            } else {
              metaJson = firstItem.metaJson as Record<string, unknown>
            }
          }

          // Parse configJson
          let configJson: Record<string, unknown> = {}
          if (section.configJson) {
            if (typeof section.configJson === 'string') {
              try {
                configJson = JSON.parse(section.configJson as string)
              } catch {
                configJson = {}
              }
            } else {
              configJson = section.configJson as Record<string, unknown>
            }
          }

          // Get productIds from section.products for PRODUCT_RAIL
          const productIds = section.products?.map((p: HomepageSectionProduct) => p.productId) || []

          // Get collectionIds from configJson or metaJson for MEDIA_TILES
          const configCollectionIds = Array.isArray(configJson?.collectionIds)
            ? configJson.collectionIds as string[]
            : []
          const metaCollectionIds = Array.isArray(metaJson?.collectionIds)
            ? metaJson.collectionIds as string[]
            : metaJson?.collectionId
              ? [metaJson.collectionId as string]
              : []
          const collectionIds = configCollectionIds.length > 0 ? configCollectionIds : metaCollectionIds

          const loadedData = {
            sectionType: section.sectionType,
            slug: section.slug || '',
            title: section.title || '',
            subtitle: section.subtitle || '',
            layout: section.layout || 'grid',
            configJson: configJson,
            isActive: section.isActive,
            sortOrder: section.sortOrder,
            startsAt: section.startsAt ? section.startsAt.slice(0, 16) : '',
            endsAt: section.endsAt ? section.endsAt.slice(0, 16) : '',
            // Item fields
            mediaUrl: firstItem?.mediaUrl || '',
            ctaLabel: firstItem?.ctaLabel || '',
            ctaUrl: firstItem?.ctaUrl || '',
            selectedProductIds: productIds,
            selectedCollectionIds: collectionIds,
          }

          setFormData(loadedData)
          setIsDirty(false)
        }
      } catch (error) {
        handleApiError(error, 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  // Warn on navigate away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleNavigate = useCallback((to: string) => {
    if (isDirty) {
      const confirmed = window.confirm(
        lang === 'vi'
          ? 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang này?'
          : 'You have unsaved changes. Are you sure you want to leave?'
      )
      if (!confirmed) return
    }
    navigate(to)
  }, [isDirty, navigate, lang])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate PRODUCT_RAIL requires at least one product
    if (formData.sectionType === 'PRODUCT_RAIL' && formData.selectedProductIds.length === 0) {
      showToast.error(lang === 'vi' ? 'Vui lòng chọn ít nhất một sản phẩm' : 'Please select at least one product')
      return
    }

    // Validate MEDIA_TILES requires at least one collection
    if (formData.sectionType === 'MEDIA_TILES' && formData.selectedCollectionIds.length === 0) {
      showToast.error(lang === 'vi' ? 'Vui lòng chọn ít nhất một bộ sưu tập' : 'Please select at least one collection')
      return
    }

    setSaving(true)

    try {
      // Convert datetime-local format to ISO 8601 with timezone
      const formatDatetime = (value: string) => {
        if (!value) return undefined
        return new Date(value).toISOString()
      }

      let sectionId = id

      const data = {
        sectionType: formData.sectionType,
        slug: formData.slug,
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        layout: formData.layout,
        configJson: formData.configJson,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
        startsAt: formatDatetime(formData.startsAt),
        endsAt: formatDatetime(formData.endsAt),
      }

      if (isEditing && id) {
        await homepageSectionApi.updateSection(id, data)
      } else {
        const created = await homepageSectionApi.createSection(data)
        sectionId = created.data.id
      }

      // Create or update item for HERO, PRODUCT_RAIL, MEDIA_TILES, ANNOUNCEMENT_BAR
      if (sectionId && ['HERO', 'PRODUCT_RAIL', 'MEDIA_TILES', 'ANNOUNCEMENT_BAR'].includes(formData.sectionType)) {
        const itemType: 'BANNER' | 'PRODUCT' | 'COLLECTION' | 'ANNOUNCEMENT' = formData.sectionType === 'HERO' ? 'BANNER'
          : formData.sectionType === 'PRODUCT_RAIL' ? 'PRODUCT'
          : formData.sectionType === 'ANNOUNCEMENT_BAR' ? 'ANNOUNCEMENT'
          : 'COLLECTION'

        const metaJson: Record<string, unknown> = {}
        if (itemType === 'PRODUCT' && formData.selectedProductIds.length > 0) {
          metaJson.productIds = formData.selectedProductIds
        }
        if (itemType === 'COLLECTION' && formData.selectedCollectionIds.length > 0) {
          metaJson.collectionIds = formData.selectedCollectionIds
        }

        const itemData = {
          itemType,
          title: formData.title,
          subtitle: formData.subtitle || undefined,
          mediaUrl: formData.mediaUrl || undefined,
          ctaLabel: formData.ctaLabel || undefined,
          ctaUrl: formData.ctaUrl || undefined,
          metaJson: Object.keys(metaJson).length > 0 ? metaJson : undefined,
        }

        // Delete existing items first if editing
        if (editingItem) {
          await homepageSectionApi.updateItem(sectionId, editingItem.id, itemData)
        } else if (sectionId) {
          // Check if section has existing items
          const existingSection = await homepageSectionApi.getSectionById(sectionId)
          if (existingSection.items?.[0]) {
            // Update existing item
            await homepageSectionApi.updateItem(sectionId, existingSection.items[0].id, itemData)
          } else {
            // Create new item
            await homepageSectionApi.createItem(sectionId, itemData)
          }
        }
      }

      // Sync products for PRODUCT_RAIL section
      if (sectionId && formData.sectionType === 'PRODUCT_RAIL') {
        // Get existing products in section
        const existingSection = await homepageSectionApi.getSectionById(sectionId)
        const existingProductIds = existingSection.products?.map((p: any) => p.productId) || []

        // Remove products that are no longer selected
        for (const existingId of existingProductIds) {
          if (!formData.selectedProductIds.includes(existingId)) {
            await homepageSectionApi.removeProduct(sectionId, existingId)
          }
        }

        // Add new products
        for (let i = 0; i < formData.selectedProductIds.length; i++) {
          const productId = formData.selectedProductIds[i]
          if (!existingProductIds.includes(productId)) {
            await homepageSectionApi.addProduct(sectionId, {
              productId,
              sortOrder: i,
            })
          }
        }
      }

      // Update configJson for MEDIA_TILES with collectionIds
      if (sectionId && formData.sectionType === 'MEDIA_TILES' && formData.selectedCollectionIds.length > 0) {
        await homepageSectionApi.updateSection(sectionId, {
          configJson: {
            ...formData.configJson,
            collectionIds: formData.selectedCollectionIds,
          },
        })
      }

      setIsDirty(false)
      showToast.success(isEditing
        ? (lang === 'vi' ? 'Cập nhật thành công' : 'Updated successfully')
        : (lang === 'vi' ? 'Tạo mới thành công' : 'Created successfully')
      )
      navigate('/admin/homepage-sections')
    } catch (error) {
      handleApiError(error, 'Failed to save section')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await homepageSectionApi.deleteSection(id)
      showToast.success(lang === 'vi' ? 'Xóa thành công' : 'Deleted successfully')
      navigate('/admin/homepage-sections')
    } catch (error) {
      handleApiError(error, 'Failed to delete section')
    }
  }

  const toggleProduct = (productId: string) => {
    updateFormData(prev => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.includes(productId)
        ? prev.selectedProductIds.filter(id => id !== productId)
        : [...prev.selectedProductIds, productId]
    }))
  }

  const toggleCollection = (collectionId: string) => {
    updateFormData(prev => ({
      ...prev,
      selectedCollectionIds: prev.selectedCollectionIds.includes(collectionId)
        ? prev.selectedCollectionIds.filter(id => id !== collectionId)
        : [...prev.selectedCollectionIds, collectionId]
    }))
  }

  const handleTitleChange = (value: string) => {
    updateFormData(prev => ({
      ...prev,
      title: value,
      // Auto-generate slug only if slug was auto-generated before
      slug: prev.slug || value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }))
  }

  const handleSlugChange = (value: string) => {
    updateFormData(prev => ({ ...prev, slug: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleNavigate('/admin/homepage-sections')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing
                ? (lang === 'vi' ? 'Chỉnh sửa Section' : 'Edit Section')
                : (lang === 'vi' ? 'Tạo Section mới' : 'Create New Section')
              }
            </h2>
            {isDirty && (
              <p className="text-sm text-amber-600">
                {lang === 'vi' ? '• Có thay đổi chưa lưu' : '• Unsaved changes'}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          className="gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {lang === 'vi' ? 'Xem trước' : 'Preview'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========== SECTION 1: Basic Info ========== */}
        <Card>
          <CardHeader>
            <CardTitle>{lang === 'vi' ? 'Thông tin cơ bản' : 'Basic Information'}</CardTitle>
            <CardDescription>
              {lang === 'vi' ? 'Slug là duy nhất, dùng để định danh section' : 'Slug is unique, used to identify the section'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Section Type */}
              <div className="space-y-2">
                <Label>{t('admin.type')} *</Label>
                <Select
                  value={formData.sectionType}
                  onValueChange={(value) => updateFormData(prev => ({ ...prev, sectionType: value as HomepageSectionType }))}
                  disabled={isEditing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {lang === 'en' ? type.label : type.labelVi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditing && (
                  <p className="text-xs text-gray-500">
                    {lang === 'vi' ? 'Không thể đổi loại khi đang chỉnh sửa' : 'Cannot change type when editing'}
                  </p>
                )}
              </div>
              {/* Sort Order */}
              <div className="space-y-2">
                <Label htmlFor="sortOrder">{t('admin.sortOrder')}</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => updateFormData(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('admin.title')}</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={lang === 'vi' ? 'VD: Sản phẩm nổi bật' : 'e.g.: Featured Products'}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">{t('admin.slug')} *</Label>
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                placeholder={lang === 'vi' ? 'VD: featured-products' : 'e.g.: featured-products'}
              />
              <p className="text-xs text-gray-500">
                {lang === 'vi'
                  ? 'Slug sẽ tự động được tạo từ tiêu đề. Chỉnh sửa nếu cần thiết.'
                  : 'Slug will be auto-generated from title. Edit if needed.'
                }
              </p>
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">{t('admin.subtitle')}</Label>
              <Input
                id="subtitle"
                type="text"
                value={formData.subtitle}
                onChange={(e) => updateFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder={lang === 'vi' ? 'VD: Khám phá bộ sưu tập mới' : 'e.g.: Discover our new collection'}
              />
            </div>

            {/* Layout - moved here and combined with info */}
            {['PRODUCT_RAIL', 'MEDIA_TILES'].includes(formData.sectionType) && (
              <div className="space-y-2">
                <Label>{lang === 'vi' ? 'Kiểu hiển thị' : 'Display Layout'}</Label>
                <Select
                  value={formData.layout}
                  onValueChange={(value) => updateFormData(prev => ({ ...prev, layout: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">
                      {lang === 'vi' ? 'Lưới (Grid)' : 'Grid'}
                    </SelectItem>
                    <SelectItem value="carousel">
                      {lang === 'vi' ? 'Carousel' : 'Carousel'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========== SECTION 2: Content Settings ========== */}
        {(formData.sectionType === 'HERO' || formData.sectionType === 'ANNOUNCEMENT_BAR') && (
          <Card>
            <CardHeader>
              <CardTitle>
                {formData.sectionType === 'HERO'
                  ? (lang === 'vi' ? 'Cài đặt Banner' : 'Banner Settings')
                  : (lang === 'vi' ? 'Cài đặt Thông báo' : 'Announcement Settings')
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.sectionType === 'HERO' && (
                <>
                  <div className="space-y-2">
                    <Label>Banner Image</Label>
                    <ImageUpload
                      value={formData.mediaUrl}
                      onChange={(url) => updateFormData(prev => ({ ...prev, mediaUrl: url }))}
                      multiple={false}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ctaLabel">CTA Label</Label>
                      <Input
                        id="ctaLabel"
                        type="text"
                        value={formData.ctaLabel}
                        onChange={(e) => updateFormData(prev => ({ ...prev, ctaLabel: e.target.value }))}
                        placeholder={lang === 'vi' ? 'VD: Mua ngay' : 'e.g., Shop Now'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ctaUrl">CTA URL</Label>
                      <Input
                        id="ctaUrl"
                        type="text"
                        value={formData.ctaUrl}
                        onChange={(e) => updateFormData(prev => ({ ...prev, ctaUrl: e.target.value }))}
                        placeholder={lang === 'vi' ? 'VD: /products' : 'e.g., /products'}
                      />
                    </div>
                  </div>
                </>
              )}
              {formData.sectionType === 'ANNOUNCEMENT_BAR' && (
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">
                    {lang === 'vi' ? 'Link thông báo (tùy chọn)' : 'Announcement Link (optional)'}
                  </Label>
                  <Input
                    id="ctaUrl"
                    type="text"
                    value={formData.ctaUrl}
                    onChange={(e) => updateFormData(prev => ({ ...prev, ctaUrl: e.target.value }))}
                    placeholder={lang === 'vi' ? 'VD: /products hoặc https://example.com' : 'e.g., /products or https://example.com'}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ========== SECTION 3: Products ========== */}
        {formData.sectionType === 'PRODUCT_RAIL' && (
          <Card>
            <CardHeader>
              <CardTitle>{lang === 'vi' ? 'Chọn sản phẩm' : 'Select Products'}</CardTitle>
              <CardDescription>
                {formData.selectedProductIds.length > 0
                  ? `${formData.selectedProductIds.length} ${lang === 'vi' ? 'sản phẩm đã chọn' : 'products selected'}`
                  : (lang === 'vi' ? 'Chọn ít nhất 1 sản phẩm' : 'Select at least 1 product')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search */}
              <Input
                placeholder={lang === 'vi' ? 'Tìm kiếm sản phẩm...' : 'Search products...'}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="max-w-sm"
              />
              {/* Product grid */}
              <div className="border border-gray-200 rounded-lg p-3 max-h-80 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    {availableProducts.length === 0
                      ? (lang === 'vi' ? 'Không có sản phẩm nào' : 'No products available')
                      : (lang === 'vi' ? 'Không tìm thấy sản phẩm' : 'No products found')}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts.map(p => {
                      const isSelected = formData.selectedProductIds.includes(p.id)
                      const primaryImage = p.images?.find(img => img.isPrimary) || p.images?.[0]
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProduct(p.id)}
                          className={cn(
                            'relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all',
                            isSelected
                              ? 'border-black bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          {/* Selection indicator */}
                          <div className={cn(
                            'absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center',
                            isSelected ? 'bg-black text-white' : 'bg-white/80 text-gray-400'
                          )}>
                            {isSelected && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          {/* Product image */}
                          <div className="aspect-[3/4] bg-gray-100">
                            {primaryImage?.publicUrl ? (
                              <img
                                src={primaryImage.publicUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {/* Product info */}
                          <div className="p-2">
                            <p className="text-sm font-medium line-clamp-2 leading-tight">{p.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{Number(p.price).toLocaleString('vi-VN')} ₫</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {/* Selected products preview */}
              {formData.selectedProductIds.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {formData.selectedProductIds.slice(0, 8).map(id => {
                    const product = availableProducts.find(p => p.id === id)
                    const primaryImage = product?.images?.find(img => img.isPrimary) || product?.images?.[0]
                    return (
                      <div key={id} className="relative group">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          {primaryImage?.publicUrl ? (
                            <img src={primaryImage.publicUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleProduct(id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                  {formData.selectedProductIds.length > 8 && (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                      +{formData.selectedProductIds.length - 8}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ========== SECTION 4: Collections ========== */}
        {formData.sectionType === 'MEDIA_TILES' && (
          <Card>
            <CardHeader>
              <CardTitle>{lang === 'vi' ? 'Chọn bộ sưu tập' : 'Select Collections'}</CardTitle>
              <CardDescription>
                {formData.selectedCollectionIds.length > 0
                  ? `${formData.selectedCollectionIds.length} ${lang === 'vi' ? 'bộ sưu tập đã chọn' : 'collections selected'}`
                  : (lang === 'vi' ? 'Chọn ít nhất 1 bộ sưu tập' : 'Select at least 1 collection')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search */}
              <Input
                placeholder={lang === 'vi' ? 'Tìm kiếm bộ sưu tập...' : 'Search collections...'}
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                className="max-w-sm"
              />
              {/* Collection grid */}
              <div className="border border-gray-200 rounded-lg p-3 max-h-80 overflow-y-auto">
                {filteredCollections.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    {availableCollections.length === 0
                      ? (lang === 'vi' ? 'Không có bộ sưu tập nào' : 'No collections available')
                      : (lang === 'vi' ? 'Không tìm thấy bộ sưu tập' : 'No collections found')}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredCollections.map(c => {
                      const isSelected = formData.selectedCollectionIds.includes(c.id)
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleCollection(c.id)}
                          className={cn(
                            'relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all',
                            isSelected
                              ? 'border-black bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          {/* Selection indicator */}
                          <div className={cn(
                            'absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center',
                            isSelected ? 'bg-black text-white' : 'bg-white/80 text-gray-400'
                          )}>
                            {isSelected && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          {/* Collection image */}
                          <div className="aspect-[3/4] bg-gray-100">
                            {c.image ? (
                              <img
                                src={c.image}
                                alt={c.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {/* Collection info */}
                          <div className="p-2">
                            <p className="text-sm font-medium line-clamp-2 leading-tight">{c.name}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {/* Selected collections preview */}
              {formData.selectedCollectionIds.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {formData.selectedCollectionIds.slice(0, 8).map(id => {
                    const collection = availableCollections.find(c => c.id === id)
                    return (
                      <div key={id} className="relative group">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          {collection?.image ? (
                            <img src={collection.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCollection(id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                  {formData.selectedCollectionIds.length > 8 && (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                      +{formData.selectedCollectionIds.length - 8}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ========== SECTION 5: Schedule & Status ========== */}
        <Card>
          <CardHeader>
            <CardTitle>{lang === 'vi' ? 'Lịch trình & Trạng thái' : 'Schedule & Status'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">{t('admin.startsAt')}</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => updateFormData(prev => ({ ...prev, startsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">{t('admin.endsAt')}</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => updateFormData(prev => ({ ...prev, endsAt: e.target.value }))}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>{t('common.active')}</Label>
                <p className="text-sm text-gray-500">
                  {lang === 'vi' ? 'Section sẽ hiển thị trên trang chủ' : 'Section will be shown on homepage'}
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onChange={(v) => updateFormData(prev => ({ ...prev, isActive: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* ========== ACTIONS ========== */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {lang === 'vi' ? 'Xóa Section' : 'Delete Section'}
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleNavigate('/admin/homepage-sections')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="gap-2"
            >
              {saving && <Spinner size="sm" className="text-white" />}
              {t('common.save')}
            </Button>
          </div>
        </div>
      </form>

      {/* ========== DELETE CONFIRMATION ========== */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}</DialogTitle>
            <DialogDescription>
              {lang === 'vi'
                ? 'Bạn có chắc muốn xóa section này? Hành động này không thể hoàn tác.'
                : 'Are you sure you want to delete this section? This action cannot be undone.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {lang === 'vi' ? 'Xóa' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== PREVIEW MODAL ========== */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{lang === 'vi' ? 'Xem trước Section' : 'Section Preview'}</DialogTitle>
            <DialogDescription>
              {lang === 'vi' ? 'Đây là giao diện xem trước, có thể khác với hiển thị thực tế' : 'This is a preview, actual display may vary'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PreviewContent sectionType={formData.sectionType} formData={formData} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              {lang === 'vi' ? 'Đóng' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
