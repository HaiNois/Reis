import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { homepageSectionApi, HomepageSection, HomepageSectionType, HomepageSectionItem } from '@/services/homepageApi'
import { productApi, Product, Collection, collectionApi } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'

const SECTION_TYPES: { value: HomepageSectionType; label: string; labelVi: string; icon: string }[] = [
  { value: 'ANNOUNCEMENT_BAR', label: 'Announcement Bar', labelVi: 'Thanh thông báo', icon: '📢' },
  { value: 'HERO', label: 'Hero', labelVi: 'Banner chính', icon: '🖼️' },
  { value: 'PRODUCT_RAIL', label: 'Product Rail', labelVi: 'Danh sách sản phẩm', icon: '👕' },
  { value: 'MEDIA_TILES', label: 'Media Tiles', labelVi: 'Ô hình ảnh', icon: '🖼️' },
  { value: 'NEW_SEASON_ARRIVALS', label: 'New Season Arrivals', labelVi: 'Bộ sưu tập mới', icon: '✨' },
]

export default function HomepageSectionsPage() {
  const { t, i18n } = useTranslation()
  const { confirm } = useConfirm()
  const lang = i18n.language || 'vi'
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [filterType, setFilterType] = useState<string>('')
  const [editingItem, setEditingItem] = useState<HomepageSectionItem | null>(null)

  // Fetch collections and products for selectors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collectionsRes, productsRes] = await Promise.all([
          collectionApi.getAllCollections(),
          productApi.getProducts({ limit: 100 }),
        ])
        setAvailableCollections(collectionsRes.data || [])
        setAvailableProducts(productsRes.data || [])
      } catch (error) {
        handleApiError(error, 'Failed to fetch data')
      }
    }
    fetchData()
  }, [])

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
    selectedProductId: '',
    selectedCollectionId: '',
  })

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      const response = await homepageSectionApi.getSections({ limit: 100 })
      setSections(response.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch sections')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate PRODUCT_RAIL requires productId
    if (formData.sectionType === 'PRODUCT_RAIL' && !formData.selectedProductId) {
      showToast.error('Please select a product for PRODUCT_RAIL section')
      return
    }

    // Validate MEDIA_TILES requires collectionId
    if (formData.sectionType === 'MEDIA_TILES' && !formData.selectedCollectionId) {
      showToast.error('Please select a collection for MEDIA_TILES section')
      return
    }

    try {
      // Convert datetime-local format to ISO 8601 with timezone
      const formatDatetime = (value: string) => {
        if (!value) return undefined
        return new Date(value).toISOString()
      }

      let sectionId = editingSection?.id

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

      if (editingSection) {
        await homepageSectionApi.updateSection(editingSection.id, data)
      } else {
        const created = await homepageSectionApi.createSection(data)
        sectionId = created.data.id
      }

      // Create or update item for HERO, PRODUCT_RAIL, MEDIA_TILES
      if (sectionId && ['HERO', 'PRODUCT_RAIL', 'MEDIA_TILES'].includes(formData.sectionType)) {
        const itemType: 'BANNER' | 'PRODUCT' | 'COLLECTION' = formData.sectionType === 'HERO' ? 'BANNER'
          : formData.sectionType === 'PRODUCT_RAIL' ? 'PRODUCT'
          : 'COLLECTION'

        const metaJson: Record<string, unknown> = {}
        if (itemType === 'PRODUCT' && formData.selectedProductId) {
          metaJson.productId = formData.selectedProductId
        }
        if (itemType === 'COLLECTION' && formData.selectedCollectionId) {
          metaJson.collectionId = formData.selectedCollectionId
        }

        const itemData = {
          itemType,
          title: formData.title,
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

      setShowModal(false)
      resetForm()
      fetchSections()
    } catch (error) {
      handleApiError(error, 'Failed to save section')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: 'Delete Section',
      description: 'Are you sure you want to delete this section? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    if (!confirmed) return
    try {
      await homepageSectionApi.deleteSection(id)
      showToast.success('Section deleted successfully')
      fetchSections()
    } catch (error) {
      handleApiError(error, 'Failed to delete section')
    }
  }

  const handleToggleActive = async (section: HomepageSection) => {
    try {
      await homepageSectionApi.updateSection(section.id, { isActive: !section.isActive })
      fetchSections()
    } catch (error) {
      handleApiError(error, 'Failed to toggle section')
    }
  }

  const resetForm = () => {
    setEditingSection(null)
    setEditingItem(null)
    setFormData({
      sectionType: 'HERO',
      slug: '',
      title: '',
      subtitle: '',
      description: '',
      layout: 'grid',
      configJson: {},
      isActive: true,
      sortOrder: 0,
      startsAt: '',
      endsAt: '',
      mediaUrl: '',
      ctaLabel: '',
      ctaUrl: '',
      selectedProductId: '',
      selectedCollectionId: '',
    })
  }

  const openEdit = async (section: HomepageSection) => {
    setEditingSection(section)

    // Fetch fresh section data with items
    try {
      const updated = await homepageSectionApi.getSectionById(section.id)
      const freshSection = updated.data

      // Parse configJson
      let parsedConfig: Record<string, unknown> = {}
      if (freshSection.configJson) {
        if (typeof freshSection.configJson === 'string') {
          try {
            parsedConfig = JSON.parse(freshSection.configJson)
          } catch {
            parsedConfig = {}
          }
        } else {
          parsedConfig = freshSection.configJson as Record<string, unknown>
        }
      }

      // Get first item if exists
      const firstItem = freshSection.items?.[0] || null
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

      setFormData({
        sectionType: freshSection.sectionType,
        slug: freshSection.slug || '',
        title: freshSection.title || '',
        subtitle: freshSection.subtitle || '',
        description: freshSection.description || '',
        layout: freshSection.layout || 'grid',
        configJson: parsedConfig,
        isActive: freshSection.isActive,
        sortOrder: freshSection.sortOrder,
        startsAt: freshSection.startsAt ? freshSection.startsAt.slice(0, 16) : '',
        endsAt: freshSection.endsAt ? freshSection.endsAt.slice(0, 16) : '',
        // Item fields
        mediaUrl: firstItem?.mediaUrl || '',
        ctaLabel: firstItem?.ctaLabel || '',
        ctaUrl: firstItem?.ctaUrl || '',
        selectedProductId: metaJson?.productId as string || '',
        selectedCollectionId: metaJson?.collectionId as string || '',
      })
    } catch (error) {
      console.error('Failed to fetch section', error)
      // Still open modal with basic data
      setFormData({
        sectionType: section.sectionType,
        slug: section.slug || '',
        title: section.title || '',
        subtitle: section.subtitle || '',
        description: section.description || '',
        layout: section.layout || 'grid',
        configJson: {},
        isActive: section.isActive,
        sortOrder: section.sortOrder,
        startsAt: section.startsAt ? section.startsAt.slice(0, 16) : '',
        endsAt: section.endsAt ? section.endsAt.slice(0, 16) : '',
        mediaUrl: '',
        ctaLabel: '',
        ctaUrl: '',
        selectedProductId: '',
        selectedCollectionId: '',
      })
    }
    setShowModal(true)
  }

  const getTypeLabel = (type: string) => {
    const found = SECTION_TYPES.find(t => t.value === type)
    if (!found) return type
    return lang === 'en' ? found.label : found.labelVi
  }

  const getTypeIcon = (type: string) => {
    const found = SECTION_TYPES.find(t => t.value === type)
    return found?.icon || '📄'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT_BAR': return 'bg-yellow-100 text-yellow-800'
      case 'HERO': return 'bg-red-100 text-red-800'
      case 'PRODUCT_RAIL': return 'bg-blue-100 text-blue-800'
      case 'MEDIA_TILES': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredSections = filterType
    ? sections.filter(s => s.sectionType === filterType)
    : sections

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.homepageSections')}</h2>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
        >
          <span>+</span>
          <span>{t('admin.addSection')}</span>
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1 rounded-full text-sm ${!filterType ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          All
        </button>
        {SECTION_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value)}
            className={`px-3 py-1 rounded-full text-sm ${filterType === type.value ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {lang === 'en' ? type.label : type.labelVi}
          </button>
        ))}
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSections.map((section) => (
          <div key={section.id} className={`bg-white rounded-lg shadow border-2 ${section.isActive ? 'border-transparent' : 'border-gray-200'}`}>
            {/* Section Preview */}
            {section.items?.some(i => i.mediaUrl) && (
              <div className="aspect-video overflow-hidden rounded-t-lg bg-gray-100">
                <img
                  src={section.items.find(i => i.mediaUrl)?.mediaUrl}
                  alt={section.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {!section.items?.some(i => i.mediaUrl) && (
              <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                <span className="text-4xl">{getTypeIcon(section.sectionType)}</span>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(section.sectionType)}`}>
                  {getTypeLabel(section.sectionType)}
                </span>
                <button
                  onClick={() => handleToggleActive(section)}
                  className={`text-xs px-2 py-1 rounded ${section.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {section.isActive ? t('common.active') : t('common.inactive')}
                </button>
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{section.title || '(No title)'}</h3>
              {section.subtitle && (
                <p className="text-sm text-gray-500 mb-2">{section.subtitle}</p>
              )}
              <p className="text-xs text-gray-400 mb-3">/{section.slug}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{section.items?.length || 0} items</span>
                <span>{(section as any)._count?.products || 0} products</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(section)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(section.id)}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📦</div>
            <p>{t('admin.noSections')}</p>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              + {t('admin.addSection')}
            </button>
          </div>
        )}
      </div>

      {/* Section Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingSection ? t('admin.editSection') : t('admin.addSection')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sectionType">{t('admin.type')} *</Label>
                    <select
                      id="sectionType"
                      value={formData.sectionType}
                      onChange={(e) => setFormData({ ...formData, sectionType: e.target.value as HomepageSectionType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={!!editingSection}
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

                {/* PRODUCT_RAIL - Product selector */}
                {formData.sectionType === 'PRODUCT_RAIL' && (
                  <div className="space-y-2">
                    <Label htmlFor="selectedProduct">Select Product</Label>
                    <select
                      id="selectedProduct"
                      value={formData.selectedProductId}
                      onChange={(e) => {
                        const product = availableProducts.find(p => p.id === e.target.value)
                        setFormData({
                          ...formData,
                          selectedProductId: e.target.value,
                          title: product?.name || formData.title,
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select a product</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {Number(p.price).toLocaleString('vi-VN')} ₫
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* MEDIA_TILES - Collection selector */}
                {formData.sectionType === 'MEDIA_TILES' && (
                  <div className="space-y-2">
                    <Label htmlFor="selectedCollection">Select Collection</Label>
                    <select
                      id="selectedCollection"
                      value={formData.selectedCollectionId}
                      onChange={(e) => {
                        const collection = availableCollections.find(c => c.id === e.target.value)
                        setFormData({
                          ...formData,
                          selectedCollectionId: e.target.value,
                          title: collection?.name || formData.title,
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select a collection</option>
                      {availableCollections.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
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

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
