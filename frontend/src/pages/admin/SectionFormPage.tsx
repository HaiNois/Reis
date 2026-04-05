import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { homepageSectionApi, HomepageSectionType, HomepageSectionProduct } from '@/services/homepageApi'
import { productApi, Product, Collection, collectionApi } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'

const SECTION_TYPES: { value: HomepageSectionType; label: string; labelVi: string; icon: string }[] = [
  { value: 'ANNOUNCEMENT_BAR', label: 'Announcement Bar', labelVi: 'Thanh thông báo', icon: '📢' },
  { value: 'HERO', label: 'Hero', labelVi: 'Banner chính', icon: '🖼️' },
  { value: 'PRODUCT_RAIL', label: 'Product Rail', labelVi: 'Danh sách sản phẩm', icon: '👕' },
  { value: 'MEDIA_TILES', label: 'Media Tiles', labelVi: 'Ô hình ảnh', icon: '🖼️' },
]

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
    description: '',
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

  // Fetch collections, products and section data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collectionsRes, productsRes] = await Promise.all([
          collectionApi.getAllCollections(),
          productApi.getProducts({ limit: 100 }),
        ])
        setAvailableCollections(collectionsRes.data || [])
        setAvailableProducts(productsRes.data || [])

        // Fetch section data if editing
        if (id) {
          const sectionRes = await homepageSectionApi.getSectionById(id)
          const section = sectionRes.data

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

          setFormData({
            sectionType: section.sectionType,
            slug: section.slug || '',
            title: section.title || '',
            subtitle: section.subtitle || '',
            description: section.description || '',
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
          })
        }
      } catch (error) {
        handleApiError(error, 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate PRODUCT_RAIL requires at least one product
    if (formData.sectionType === 'PRODUCT_RAIL' && formData.selectedProductIds.length === 0) {
      showToast.error('Please select at least one product for PRODUCT_RAIL section')
      return
    }

    // Validate MEDIA_TILES requires at least one collection
    if (formData.sectionType === 'MEDIA_TILES' && formData.selectedCollectionIds.length === 0) {
      showToast.error('Please select at least one collection for MEDIA_TILES section')
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
        description: formData.description || undefined,
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
          if (existingSection.data.items?.[0]) {
            // Update existing item
            await homepageSectionApi.updateItem(sectionId, existingSection.data.items[0].id, itemData)
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
        const existingProductIds = existingSection.data.products?.map((p: any) => p.productId) || []

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

      showToast.success(isEditing ? 'Section updated successfully' : 'Section created successfully')
      navigate('/admin/homepage-sections')
    } catch (error) {
      handleApiError(error, 'Failed to save section')
    } finally {
      setSaving(false)
    }
  }

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.includes(productId)
        ? prev.selectedProductIds.filter(id => id !== productId)
        : [...prev.selectedProductIds, productId]
    }))
  }

  const toggleCollection = (collectionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCollectionIds: prev.selectedCollectionIds.includes(collectionId)
        ? prev.selectedCollectionIds.filter(id => id !== collectionId)
        : [...prev.selectedCollectionIds, collectionId]
    }))
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
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/homepage-sections')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? t('admin.editSection') : t('admin.addSection')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sectionType">{t('admin.type')} *</Label>
            <select
              id="sectionType"
              value={formData.sectionType}
              onChange={(e) => setFormData({ ...formData, sectionType: e.target.value as HomepageSectionType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={isEditing}
            >
              {SECTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {lang === 'en' ? type.label : type.labelVi}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">{t('admin.sortOrder')}</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{t('admin.title')}</Label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({
              ...formData,
              title: e.target.value,
              slug: formData.slug || e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            })}
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
          <Label htmlFor="subtitle">{t('admin.subtitle')}</Label>
          <Input
            id="subtitle"
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
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

        {['PRODUCT_RAIL', 'MEDIA_TILES'].includes(formData.sectionType) && (
          <div className="space-y-2">
            <Label htmlFor="layout">Layout</Label>
            <select
              id="layout"
              value={formData.layout}
              onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>
        )}

        {/* HERO - Banner fields */}
        {formData.sectionType === 'HERO' && (
          <>
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <ImageUpload
                value={formData.mediaUrl}
                onChange={(url) => setFormData({ ...formData, mediaUrl: url })}
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
                  onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                  placeholder="e.g., Shop Now"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaUrl">CTA URL</Label>
                <Input
                  id="ctaUrl"
                  type="text"
                  value={formData.ctaUrl}
                  onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                  placeholder="e.g., /products"
                />
              </div>
            </div>
          </>
        )}

        {/* ANNOUNCEMENT_BAR - Announcement text */}
        {formData.sectionType === 'ANNOUNCEMENT_BAR' && (
          <div className="space-y-2">
            <Label htmlFor="ctaUrl">Announcement Link URL (optional)</Label>
            <Input
              id="ctaUrl"
              type="text"
              value={formData.ctaUrl}
              onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
              placeholder="e.g., /products or https://example.com"
            />
          </div>
        )}

        {/* PRODUCT_RAIL - Multi Product selector with card grid */}
        {formData.sectionType === 'PRODUCT_RAIL' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{lang === 'vi' ? 'Chọn sản phẩm' : 'Select Products'}</Label>
              <span className="text-sm text-gray-500">
                {formData.selectedProductIds.length} selected
              </span>
            </div>
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
                        className={`
                          relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all
                          ${isSelected
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                        `}
                      >
                        {/* Selection indicator */}
                        <div className={`
                          absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center
                          ${isSelected ? 'bg-black text-white' : 'bg-white/80 text-gray-400'}
                        `}>
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
              <div className="flex flex-wrap gap-2">
                {formData.selectedProductIds.slice(0, 5).map(id => {
                  const product = availableProducts.find(p => p.id === id)
                  const primaryImage = product?.images?.find(img => img.isPrimary) || product?.images?.[0]
                  return (
                    <div key={id} className="relative group">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                        {primaryImage?.publicUrl ? (
                          <img src={primaryImage.publicUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100" />
                        )}
                      </div>
                      <button
                        onClick={() => toggleProduct(id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
                {formData.selectedProductIds.length > 5 && (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{formData.selectedProductIds.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MEDIA_TILES - Multi Collection selector with card grid */}
        {formData.sectionType === 'MEDIA_TILES' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{lang === 'vi' ? 'Chọn bộ sưu tập' : 'Select Collections'}</Label>
              <span className="text-sm text-gray-500">
                {formData.selectedCollectionIds.length} selected
              </span>
            </div>
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
                        className={`
                          relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all
                          ${isSelected
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                        `}
                      >
                        {/* Selection indicator */}
                        <div className={`
                          absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center
                          ${isSelected ? 'bg-black text-white' : 'bg-white/80 text-gray-400'}
                        `}>
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
              <div className="flex flex-wrap gap-2">
                {formData.selectedCollectionIds.slice(0, 5).map(id => {
                  const collection = availableCollections.find(c => c.id === id)
                  return (
                    <div key={id} className="relative group">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                        {collection?.image ? (
                          <img src={collection.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <button
                        onClick={() => toggleCollection(id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
                {formData.selectedCollectionIds.length > 5 && (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{formData.selectedCollectionIds.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startsAt">{t('admin.startsAt')}</Label>
            <Input
              id="startsAt"
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endsAt">{t('admin.endsAt')}</Label>
            <Input
              id="endsAt"
              type="datetime-local"
              value={formData.endsAt}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4"
          />
          <Label htmlFor="isActive" className="text-sm text-gray-700">
            {t('common.active')}
          </Label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/admin/homepage-sections')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}