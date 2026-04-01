import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { homepageSectionApi, HomepageSection, HomepageSectionType } from '@/services/homepageApi'
import { productApi, Product, Collection } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([])
  const [searchProducts, setSearchProducts] = useState('')
  const [filterType, setFilterType] = useState<string>('')

  // Fetch collections for MEDIA_TILES section
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await productApi.getCollections()
        setAvailableCollections(response.data || [])
      } catch (error) {
        handleApiError(error, 'Failed to fetch collections')
      }
    }
    fetchCollections()
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

  const fetchAvailableProducts = async () => {
    try {
      const response = await productApi.getProducts({ limit: 100, status: 'ACTIVE' })
      setAvailableProducts(response.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch products')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        startsAt: formData.startsAt || undefined,
        endsAt: formData.endsAt || undefined,
      }

      if (editingSection) {
        await homepageSectionApi.updateSection(editingSection.id, data)
      } else {
        await homepageSectionApi.createSection(data)
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
    })
  }

  const openEdit = (section: HomepageSection) => {
    setEditingSection(section)
    setFormData({
      sectionType: section.sectionType,
      slug: section.slug || '',
      title: section.title || '',
      subtitle: section.subtitle || '',
      description: section.description || '',
      layout: section.layout || 'grid',
      configJson: (section.configJson as Record<string, unknown>) || {},
      isActive: section.isActive,
      sortOrder: section.sortOrder,
      startsAt: section.startsAt ? section.startsAt.slice(0, 16) : '',
      endsAt: section.endsAt ? section.endsAt.slice(0, 16) : '',
    })
    setShowModal(true)
  }

  const openItemsEditor = (section: HomepageSection) => {
    setEditingSection(section)
    setShowItemsModal(true)
  }

  const openProductEditor = async (section: HomepageSection) => {
    setEditingSection(section)
    await fetchAvailableProducts()
    setShowProductModal(true)
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
                {['PRODUCT_RAIL'].includes(section.sectionType) && (
                  <button
                    onClick={() => openProductEditor(section)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Products
                  </button>
                )}
                {['MEDIA_TILES', 'ANNOUNCEMENT_BAR'].includes(section.sectionType) && (
                  <button
                    onClick={() => openItemsEditor(section)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Items
                  </button>
                )}
                <button
                  onClick={() => openEdit(section)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
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

      {/* Items Editor Modal */}
      {showItemsModal && editingSection && (
        <SectionItemsEditor
          section={editingSection}
          onClose={() => {
            setShowItemsModal(false)
            fetchSections()
          }}
        />
      )}

      {/* Product Editor Modal */}
      {showProductModal && editingSection && (
        <ProductRailEditor
          section={editingSection}
          availableProducts={availableProducts}
          onClose={() => {
            setShowProductModal(false)
            fetchSections()
          }}
          onSearch={setSearchProducts}
          searchValue={searchProducts}
        />
      )}
    </div>
  )
}

// ==================== SECTION ITEMS EDITOR ====================

function SectionItemsEditor({ section, onClose }: { section: HomepageSection; onClose: () => void }) {
  const { t } = useTranslation()
  const [items, setItems] = useState(section.items || [])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const [itemForm, setItemForm] = useState({
    itemType: 'MEDIA_TILE' as string,
    title: '',
    subtitle: '',
    description: '',
    mediaUrl: '',
    mobileMediaUrl: '',
    mediaType: 'IMAGE',
    ctaLabel: '',
    ctaUrl: '',
    linkTarget: 'SELF',
    isActive: true,
    sortOrder: 0,
    // For PRODUCT type
    selectedProductId: '',
    // For COLLECTION type
    selectedCollectionId: '',
    // For BANNER type (New Season Arrivals)
    selectedImageUrl: '',
  })

  const getItemTypeOptions = () => {
    switch (section.sectionType) {
      case 'ANNOUNCEMENT_BAR':
        return [{ value: 'ANNOUNCEMENT', label: 'Announcement' }]
      case 'HERO':
        return [{ value: 'BANNER', label: 'Hero Banner' }]
      case 'PRODUCT_RAIL':
        return [{ value: 'PRODUCT', label: 'Product' }]
      case 'MEDIA_TILES':
        return [{ value: 'COLLECTION', label: 'Collection' }]
      case 'NEW_SEASON_ARRIVALS':
        return [{ value: 'BANNER', label: 'Banner Image' }]
      default:
        return [{ value: 'MEDIA_TILE', label: 'Media Tile' }]
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formDataWithTypes = {
        ...itemForm,
        itemType: itemForm.itemType as any,
        mediaType: itemForm.mediaType as any,
        linkTarget: itemForm.linkTarget as any,
      }
      if (editingItem) {
        await homepageSectionApi.updateItem(section.id, editingItem.id, formDataWithTypes)
      } else {
        await homepageSectionApi.createItem(section.id, formDataWithTypes)
      }
      setShowModal(false)
      resetItemForm()
      // Refresh section
      const updated = await homepageSectionApi.getSectionById(section.id)
      setItems(updated.data.items)
    } catch (error) {
      handleApiError(error, 'Failed to save item')
    }
  }

  const handleDelete = async (itemId: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: 'Delete Item',
      description: 'Are you sure you want to delete this item?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    if (!confirmed) return
    try {
      await homepageSectionApi.deleteItem(section.id, itemId)
      const updated = await homepageSectionApi.getSectionById(section.id)
      setItems(updated.data.items)
    } catch (error) {
      handleApiError(error, 'Failed to delete item')
    }
  }

  const resetItemForm = () => {
    setEditingItem(null)
    setItemForm({
      itemType: getItemTypeOptions()[0]?.value || 'MEDIA_TILE',
      title: '',
      subtitle: '',
      description: '',
      mediaUrl: '',
      mobileMediaUrl: '',
      mediaType: 'IMAGE',
      ctaLabel: '',
      ctaUrl: '',
      linkTarget: 'SELF',
      isActive: true,
      sortOrder: 0,
    })
  }

  const openEdit = (item: any) => {
    setEditingItem(item)
    setItemForm({
      itemType: item.itemType,
      title: item.title || '',
      subtitle: item.subtitle || '',
      description: item.description || '',
      mediaUrl: item.mediaUrl || '',
      mobileMediaUrl: item.mobileMediaUrl || '',
      mediaType: item.mediaType || 'IMAGE',
      ctaLabel: item.ctaLabel || '',
      ctaUrl: item.ctaUrl || '',
      linkTarget: item.linkTarget || 'SELF',
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    })
    setShowModal(true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {t('admin.manageProducts')} - {section.title}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                resetItemForm()
                setShowModal(true)
              }}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              + Add Item
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {item.mediaUrl && (
                    <img src={item.mediaUrl} alt="" className="w-12 h-12 object-cover rounded" />
                  )}
                  <div>
                    <span className="font-medium">{item.title}</span>
                    {item.subtitle && <span className="text-gray-400 ml-2">/ {item.subtitle}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">Delete</button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-gray-500 text-center py-8">No items yet</p>
            )}
          </div>

          {/* Item Form Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
                <h4 className="text-lg font-bold mb-4">{editingItem ? 'Edit Item' : 'Add Item'}</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemType">Type</Label>
                    <select
                      id="itemType"
                      value={itemForm.itemType}
                      onChange={(e) => {
                        setItemForm({ ...itemForm, itemType: e.target.value })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {getItemTypeOptions().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* PRODUCT: Product Selector */}
                  {itemForm.itemType === 'PRODUCT' && (
                    <div className="space-y-2">
                      <Label htmlFor="selectedProduct">Select Product</Label>
                      <select
                        id="selectedProduct"
                        value={itemForm.selectedProductId}
                        onChange={(e) => {
                          const product = availableProducts.find(p => p.id === e.target.value)
                          setItemForm({
                            ...itemForm,
                            selectedProductId: e.target.value,
                            title: product?.name || '',
                            mediaUrl: product?.image || '',
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

                  {/* COLLECTION: Collection Selector */}
                  {itemForm.itemType === 'COLLECTION' && (
                    <div className="space-y-2">
                      <Label htmlFor="selectedCollection">Select Collection</Label>
                      <select
                        id="selectedCollection"
                        value={itemForm.selectedCollectionId}
                        onChange={(e) => {
                          const collection = availableCollections.find(c => c.id === e.target.value)
                          setItemForm({
                            ...itemForm,
                            selectedCollectionId: e.target.value,
                            title: collection?.name || '',
                            mediaUrl: collection?.image || '',
                            ctaUrl: `/collections/${collection?.slug}`,
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

                  {/* BANNER: Image Upload for New Season Arrivals */}
                  {itemForm.itemType === 'BANNER' && (
                    <div className="space-y-2">
                      <Label>Banner Image</Label>
                      <ImageUpload
                        value={itemForm.selectedImageUrl}
                        onChange={(url) => setItemForm({ ...itemForm, selectedImageUrl: url })}
                        multiple={false}
                      />
                    </div>
                  )}

                  {/* Common fields for MEDIA_TILE, ANNOUNCEMENT */}
                  {['MEDIA_TILE', 'ANNOUNCEMENT'].includes(itemForm.itemType) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="itemTitle">Title *</Label>
                        <Input
                          id="itemTitle"
                          type="text"
                          value={itemForm.title}
                          onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="itemSubtitle">Subtitle</Label>
                        <Input
                          id="itemSubtitle"
                          type="text"
                          value={itemForm.subtitle}
                          onChange={(e) => setItemForm({ ...itemForm, subtitle: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mediaUrl">Image URL</Label>
                          <Input
                            id="mediaUrl"
                            type="url"
                            value={itemForm.mediaUrl}
                            onChange={(e) => setItemForm({ ...itemForm, mediaUrl: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobileMediaUrl">Mobile Image</Label>
                          <Input
                            id="mobileMediaUrl"
                            type="url"
                            value={itemForm.mobileMediaUrl}
                            onChange={(e) => setItemForm({ ...itemForm, mobileMediaUrl: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ctaLabel">CTA Label</Label>
                          <Input
                            id="ctaLabel"
                            type="text"
                            value={itemForm.ctaLabel}
                            onChange={(e) => setItemForm({ ...itemForm, ctaLabel: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ctaUrl">CTA URL</Label>
                          <Input
                            id="ctaUrl"
                            type="url"
                            value={itemForm.ctaUrl}
                            onChange={(e) => setItemForm({ ...itemForm, ctaUrl: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== PRODUCT RAIL EDITOR ====================

function ProductRailEditor({
  section,
  availableProducts,
  onClose,
  onSearch,
  searchValue,
}: {
  section: HomepageSection
  availableProducts: Product[]
  onClose: () => void
  onSearch: (v: string) => void
  searchValue: string
}) {
  const { t } = useTranslation()
  const [products, setProducts] = useState(section.products || [])
  const [showModal, setShowModal] = useState(false)

  const [productForm, setProductForm] = useState({
    productId: '',
    badgeText: '',
    sortOrder: 0,
  })

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await homepageSectionApi.addProduct(section.id, productForm)
      setShowModal(false)
      setProductForm({ productId: '', badgeText: '', sortOrder: 0 })
      // Refresh
      const updated = await homepageSectionApi.getSectionById(section.id)
      setProducts(updated.data.products)
    } catch (error) {
      handleApiError(error, 'Failed to add product')
    }
  }

  const handleRemoveProduct = async (productId: string) => {
    try {
      await homepageSectionApi.removeProduct(section.id, productId)
      const updated = await homepageSectionApi.getSectionById(section.id)
      setProducts(updated.data.products)
    } catch (error) {
      handleApiError(error, 'Failed to remove product')
    }
  }

  const filteredAvailable = availableProducts.filter(
    p => !products.some(sp => sp.productId === p.id) &&
    (p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
     (p.nameEn && p.nameEn.toLowerCase().includes(searchValue.toLowerCase())))
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Products - {section.title}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {/* Current Products */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Current Products</h4>
            <div className="space-y-2">
              {products.map((sp, idx) => (
                <div key={sp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs">{idx + 1}</span>
                    <span className="font-medium">{sp.product.name}</span>
                    {sp.badgeText && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">{sp.badgeText}</span>
                    )}
                    <span className="text-gray-500">
                      {Number(sp.product.price).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(sp.productId)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-gray-500 text-center py-4">No products assigned</p>
              )}
            </div>
          </div>

          {/* Add Product */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">Add Products</h4>
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1 bg-black text-white text-sm rounded-lg"
              >
                + Add
              </button>
            </div>
            <input
              type="text"
              placeholder={t('admin.searchProducts')}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Add Product Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
                <h4 className="text-lg font-bold mb-4">Add Product</h4>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="selectProduct">Select Product *</Label>
                    <select
                      id="selectProduct"
                      value={productForm.productId}
                      onChange={(e) => setProductForm({ ...productForm, productId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Select a product</option>
                      {filteredAvailable.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {Number(p.price).toLocaleString('vi-VN')} ₫
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="badgeText">Badge Text</Label>
                    <Input
                      id="badgeText"
                      type="text"
                      value={productForm.badgeText}
                      onChange={(e) => setProductForm({ ...productForm, badgeText: e.target.value })}
                      placeholder="e.g., Sale, New, Best Seller"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Add
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
