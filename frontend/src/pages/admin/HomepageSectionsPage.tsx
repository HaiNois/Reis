import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { homepageSectionApi, HomepageSection, HomepageSectionType } from '@/services/homepageApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/providers/confirm-provider'
import { cn } from '@/lib/utils'

const SECTION_TYPES: { value: HomepageSectionType; label: string; labelVi: string; icon: string }[] = [
  { value: 'ANNOUNCEMENT_BAR', label: 'Announcement Bar', labelVi: 'Thanh thông báo', icon: '📢' },
  { value: 'HERO', label: 'Hero', labelVi: 'Banner chính', icon: '🖼️' },
  { value: 'PRODUCT_RAIL', label: 'Product Rail', labelVi: 'Danh sách sản phẩm', icon: '👕' },
  { value: 'MEDIA_TILES', label: 'Media Tiles', labelVi: 'Ô hình ảnh', icon: '🖼️' },
]

// Simple date formatter
function formatDate(dateString: string, lang: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

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
      handleApiError(error, lang === 'vi' ? 'Không thể tải danh sách sections' : 'Failed to fetch sections')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: lang === 'vi' ? 'Xóa Section' : 'Delete Section',
      description: lang === 'vi'
        ? 'Bạn có chắc muốn xóa section này? Hành động này không thể hoàn tác.'
        : 'Are you sure you want to delete this section? This action cannot be undone.',
      confirmText: lang === 'vi' ? 'Xóa' : 'Delete',
      cancelText: lang === 'vi' ? 'Hủy' : 'Cancel',
    })
    if (!confirmed) return
    try {
      await homepageSectionApi.deleteSection(id)
      showToast.success(lang === 'vi' ? 'Xóa thành công' : 'Deleted successfully')
      fetchSections()
    } catch (error) {
      handleApiError(error, lang === 'vi' ? 'Không thể xóa section' : 'Failed to delete section')
    }
  }

  const handleDuplicate = async (section: HomepageSection) => {
    try {
      const newData = {
        sectionType: section.sectionType,
        slug: `${section.slug}-copy-${Date.now()}`,
        title: section.title ? `${section.title} (Copy)` : '',
        subtitle: section.subtitle || '',
        description: section.description || '',
        layout: section.layout || 'grid',
        configJson: section.configJson || {},
        isActive: false, // Duplicated sections should be inactive by default
        sortOrder: section.sortOrder + 1,
      }
      await homepageSectionApi.createSection(newData)
      showToast.success(lang === 'vi' ? 'Nhân bản thành công' : 'Duplicated successfully')
      fetchSections()
    } catch (error) {
      handleApiError(error, lang === 'vi' ? 'Không thể nhân bản section' : 'Failed to duplicate section')
    }
  }

  const handleToggleActive = async (section: HomepageSection, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await homepageSectionApi.updateSection(section.id, { isActive: !section.isActive })
      fetchSections()
    } catch (error) {
      handleApiError(error, lang === 'vi' ? 'Không thể thay đổi trạng thái' : 'Failed to toggle status')
    }
  }

  const openEdit = (section: HomepageSection) => {
    navigate(`/admin/homepage-sections/${section.id}`)
  }

  const openCreate = () => {
    navigate('/admin/homepage-sections/new')
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
      case 'ANNOUNCEMENT_BAR': return 'bg-amber-100 text-amber-800'
      case 'HERO': return 'bg-rose-100 text-rose-800'
      case 'PRODUCT_RAIL': return 'bg-blue-100 text-blue-800'
      case 'MEDIA_TILES': return 'bg-violet-100 text-violet-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isScheduled = (section: HomepageSection): boolean => {
    const now = new Date()
    if (section.startsAt && new Date(section.startsAt) > now) return true
    if (section.endsAt && new Date(section.endsAt) < now) return true
    return false
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.homepageSections')}</h2>
        <Button onClick={openCreate} className="gap-2">
          <span>+</span>
          <span>{t('admin.addSection')}</span>
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            !filterType
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {lang === 'vi' ? 'Tất cả' : 'All'}
        </button>
        {SECTION_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
              filterType === type.value
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <span>{type.icon}</span>
            <span>{lang === 'en' ? type.label : type.labelVi}</span>
          </button>
        ))}
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSections.map((section) => {
          const scheduled = isScheduled(section)
          const mediaItem = section.items?.find(i => i.mediaUrl)

          return (
            <div
              key={section.id}
              onClick={() => openEdit(section)}
              className={cn(
                'bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5',
                section.isActive && !scheduled ? 'border-transparent' : 'border-gray-200',
                !section.isActive && 'opacity-60',
                scheduled && 'border-dashed border-amber-400'
              )}
            >
              {/* Section Preview */}
              <div className="aspect-video overflow-hidden rounded-t-xl bg-gray-100 relative">
                {mediaItem?.mediaUrl ? (
                  <img
                    src={mediaItem.mediaUrl}
                    alt={section.title || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                    <span className="text-5xl">{getTypeIcon(section.sectionType)}</span>
                  </div>
                )}

                {/* Scheduled badge */}
                {scheduled && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                    {lang === 'vi' ? 'Đã lên lịch' : 'Scheduled'}
                  </div>
                )}

                {/* View on site link */}
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                  title={lang === 'vi' ? 'Xem trên site' : 'View on site'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <div className="p-4">
                {/* Type & Status row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', getTypeColor(section.sectionType))}>
                      {getTypeLabel(section.sectionType)}
                    </span>
                  </div>

                  {/* Active toggle - larger and more visible */}
                  <button
                    onClick={(e) => handleToggleActive(section, e)}
                    className={cn(
                      'relative px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                      section.isActive
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        section.isActive ? 'bg-white' : 'bg-gray-400'
                      )} />
                      {section.isActive
                        ? (lang === 'vi' ? 'Hoạt động' : 'Active')
                        : (lang === 'vi' ? 'Tắt' : 'Inactive')
                      }
                    </span>
                  </button>
                </div>

                {/* Title & Subtitle */}
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {section.title || (lang === 'vi' ? '(Không có tiêu đề)' : '(No title)')}
                </h3>
                {section.subtitle && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-1">{section.subtitle}</p>
                )}
                <p className="text-xs text-gray-400 mb-3 font-mono">/{section.slug}</p>

                {/* Schedule info */}
                {(section.startsAt || section.endsAt) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {section.startsAt && (
                        <span>{lang === 'vi' ? 'Từ' : 'From'}: {formatDate(section.startsAt, lang)}</span>
                      )}
                      {section.startsAt && section.endsAt && ' • '}
                      {section.endsAt && (
                        <span>{lang === 'vi' ? 'đến' : 'Until'}: {formatDate(section.endsAt, lang)}</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-3 border-b border-gray-100">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    {section.items?.length || 0} {lang === 'vi' ? 'items' : 'items'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {(section as any)._count?.products || 0} {lang === 'vi' ? 'sản phẩm' : 'products'}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(section)}
                    className="flex-1 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    {lang === 'vi' ? 'Sửa' : 'Edit'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(section) }}
                    className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    title={lang === 'vi' ? 'Nhân bản' : 'Duplicate'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(section.id) }}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                    title={lang === 'vi' ? 'Xóa' : 'Delete'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredSections.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
            <p className="text-gray-500 mb-6">
              {filterType
                ? (lang === 'vi' ? 'Không có section nào thuộc loại này' : 'No sections found with this type')
                : (lang === 'vi' ? 'Chưa có section nào' : 'No sections yet')
              }
            </p>
            <Button onClick={openCreate} className="gap-2">
              <span>+</span>
              <span>{t('admin.addSection')}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
