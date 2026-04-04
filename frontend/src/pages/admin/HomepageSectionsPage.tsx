import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { homepageSectionApi, HomepageSection, HomepageSectionType } from '@/services/homepageApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/components/providers/confirm-provider'

const SECTION_TYPES: { value: HomepageSectionType; label: string; labelVi: string; icon: string }[] = [
  { value: 'ANNOUNCEMENT_BAR', label: 'Announcement Bar', labelVi: 'Thanh thông báo', icon: '📢' },
  { value: 'HERO', label: 'Hero', labelVi: 'Banner chính', icon: '🖼️' },
  { value: 'PRODUCT_RAIL', label: 'Product Rail', labelVi: 'Danh sách sản phẩm', icon: '👕' },
  { value: 'MEDIA_TILES', label: 'Media Tiles', labelVi: 'Ô hình ảnh', icon: '🖼️' },
]

export default function HomepageSectionsPage() {
  const { t, i18n } = useTranslation()
  const { confirm } = useConfirm()
  const navigate = useNavigate()
  const lang = i18n.language || 'vi'
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('')

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

  const openEdit = (section: HomepageSection) => {
    navigate(`/admin/homepage-sections/${section.id}/edit`)
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
          onClick={() => navigate('/admin/homepage-sections/new')}
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
              onClick={() => navigate('/admin/homepage-sections/new')}
              className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              + {t('admin.addSection')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
