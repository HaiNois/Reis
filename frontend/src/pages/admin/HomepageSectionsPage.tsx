import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Image as ImageIcon,
  Shirt,
  LayoutGrid,
  FolderTree,
  Sparkles,
  Megaphone,
  FileText,
  Calendar,
  Copy,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Plus,
  Package,
  type LucideIcon,
} from 'lucide-react'
import { homepageSectionApi, HomepageSection, HomepageSectionType } from '@/services/homepageApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/providers/confirm-provider'
import { cn } from '@/lib/utils'

interface SectionTypeMeta {
  value: HomepageSectionType
  label: string
  labelVi: string
  Icon: LucideIcon
}

const SECTION_TYPES: SectionTypeMeta[] = [
  { value: 'HERO', label: 'Hero', labelVi: 'Banner chính', Icon: ImageIcon },
  { value: 'PRODUCT_RAIL', label: 'Product Rail', labelVi: 'Danh sách sản phẩm', Icon: Shirt },
  { value: 'MEDIA_TILES', label: 'Media Tiles', labelVi: 'Ô hình ảnh', Icon: LayoutGrid },
  { value: 'CATEGORY_SHOWCASE', label: 'Category Showcase', labelVi: 'Showcase danh mục', Icon: FolderTree },
  { value: 'NEW_SEASON_ARRIVALS', label: 'New Arrivals', labelVi: 'Hàng mới về', Icon: Sparkles },
  { value: 'STATIC_BANNER', label: 'Static Banner', labelVi: 'Banner tĩnh (3 ô)', Icon: Megaphone },
]

function formatDate(dateString: string, lang: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
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
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      const result = await homepageSectionApi.getSections({ limit: 100 })
      const sectionsArray: HomepageSection[] = Array.isArray(result)
        ? result
        : (result?.data || [])
      // Sort by sortOrder for stable ordering — list reflects storefront sequence.
      sectionsArray.sort((a, b) => a.sortOrder - b.sortOrder)
      setSections(sectionsArray)
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
        isActive: false,
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

  // Reorder by swapping sortOrder with neighbor in the *unfiltered* sequence.
  // Filter view is read-only for ordering — admin sees full list when reordering.
  const handleMove = async (section: HomepageSection, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation()
    const idx = sections.findIndex((s) => s.id === section.id)
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || targetIdx < 0 || targetIdx >= sections.length) return
    const neighbor = sections[targetIdx]

    setReorderingId(section.id)
    try {
      await homepageSectionApi.reorderSections([
        { id: section.id, sortOrder: neighbor.sortOrder },
        { id: neighbor.id, sortOrder: section.sortOrder },
      ])
      // Optimistic local update
      const next = [...sections]
      next[idx] = { ...section, sortOrder: neighbor.sortOrder }
      next[targetIdx] = { ...neighbor, sortOrder: section.sortOrder }
      next.sort((a, b) => a.sortOrder - b.sortOrder)
      setSections(next)
    } catch (error) {
      handleApiError(error, lang === 'vi' ? 'Không thể đổi thứ tự' : 'Failed to reorder')
    } finally {
      setReorderingId(null)
    }
  }

  const openEdit = (section: HomepageSection) => {
    navigate(`/admin/homepage-sections/${section.id}/edit`)
  }

  const openCreate = () => {
    navigate('/admin/homepage-sections/new')
  }

  const getTypeMeta = (type: HomepageSectionType): SectionTypeMeta => {
    return (
      SECTION_TYPES.find((t) => t.value === type) ?? {
        value: type,
        label: type,
        labelVi: type,
        Icon: FileText,
      }
    )
  }

  const isScheduled = (section: HomepageSection): boolean => {
    const now = new Date()
    if (section.startsAt && new Date(section.startsAt) > now) return true
    if (section.endsAt && new Date(section.endsAt) < now) return true
    return false
  }

  const filteredSections = filterType
    ? sections.filter((s) => s.sectionType === filterType)
    : sections

  const isFiltered = Boolean(filterType)

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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.homepageSections')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'vi'
              ? 'Thứ tự dưới đây là thứ tự render trên trang chủ'
              : 'The order below mirrors the homepage render order'}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
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
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          )}
        >
          {lang === 'vi' ? 'Tất cả' : 'All'}
        </button>
        {SECTION_TYPES.map((type) => {
          const Icon = type.Icon
          return (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                filterType === type.value
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              )}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{lang === 'en' ? type.label : type.labelVi}</span>
            </button>
          )
        })}
      </div>

      {isFiltered && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 mb-4 rounded">
          {lang === 'vi'
            ? 'Đang lọc: nút đổi thứ tự bị tắt khi filter. Bỏ filter để sắp xếp.'
            : 'Filter active: reorder is disabled. Clear filter to sort.'}
        </p>
      )}

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSections.map((section, displayIdx) => {
          const scheduled = isScheduled(section)
          const mediaItem = section.items?.find((i) => i.mediaUrl)
          const meta = getTypeMeta(section.sectionType)
          const Icon = meta.Icon
          const globalIdx = sections.findIndex((s) => s.id === section.id)
          const canMoveUp = !isFiltered && globalIdx > 0
          const canMoveDown = !isFiltered && globalIdx < sections.length - 1
          const isMoving = reorderingId === section.id

          return (
            <div
              key={section.id}
              onClick={() => openEdit(section)}
              className={cn(
                'group bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 relative',
                section.isActive && !scheduled ? 'border-transparent' : 'border-gray-200',
                !section.isActive && 'opacity-60',
                scheduled && 'border-dashed border-amber-400',
                isMoving && 'opacity-50 pointer-events-none',
              )}
            >
              {/* Position badge — editorial-style large numeral */}
              <div className="absolute -top-2 -left-2 z-10 w-9 h-9 bg-stone-900 text-white font-serif font-light flex items-center justify-center rounded-full shadow-md">
                <span className="text-sm tabular-nums">
                  {String(isFiltered ? displayIdx + 1 : globalIdx + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Section Preview */}
              <div className="aspect-video overflow-hidden rounded-t-xl bg-gray-100 relative">
                {mediaItem?.mediaUrl ? (
                  <img
                    src={mediaItem.mediaUrl}
                    alt={section.title || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-50">
                    <Icon className="w-12 h-12 text-stone-400" strokeWidth={1.25} />
                  </div>
                )}

                {scheduled && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" strokeWidth={2} />
                    {lang === 'vi' ? 'Đã lên lịch' : 'Scheduled'}
                  </div>
                )}

                {/* Reorder buttons */}
                <div className="absolute top-2 right-12 flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={!canMoveUp || isMoving}
                    onClick={(e) => handleMove(section, 'up', e)}
                    className="p-1 bg-white/90 hover:bg-white rounded text-stone-700 hover:text-stone-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={lang === 'vi' ? 'Lên' : 'Move up'}
                  >
                    <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    disabled={!canMoveDown || isMoving}
                    onClick={(e) => handleMove(section, 'down', e)}
                    className="p-1 bg-white/90 hover:bg-white rounded text-stone-700 hover:text-stone-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={lang === 'vi' ? 'Xuống' : 'Move down'}
                  >
                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>

                {/* View on site link — anchor to section slug */}
                <a
                  href={`/?focus=${section.slug}#section-${section.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full text-stone-600 hover:text-stone-900 transition-colors"
                  title={lang === 'vi' ? 'Xem trên site' : 'View on site'}
                >
                  <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                </a>
              </div>

              <div className="p-4">
                {/* Type & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1.5">
                    <Icon className="w-3 h-3" strokeWidth={1.5} />
                    {lang === 'en' ? meta.label : meta.labelVi}
                  </span>

                  {/* Active toggle — neutral, dot indicator */}
                  <button
                    onClick={(e) => handleToggleActive(section, e)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-all border',
                      section.isActive
                        ? 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'
                        : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400',
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        section.isActive ? 'bg-emerald-400' : 'bg-stone-300',
                      )}
                    />
                    {section.isActive
                      ? lang === 'vi' ? 'Hoạt động' : 'Active'
                      : lang === 'vi' ? 'Tắt' : 'Inactive'}
                  </button>
                </div>

                {/* Title & Subtitle */}
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {section.title || (lang === 'vi' ? '(Không có tiêu đề)' : '(No title)')}
                </h3>
                {section.subtitle && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-1">{section.subtitle}</p>
                )}
                {/* Slug — visible on hover (parent has `group` class) */}
                <p className="text-xs text-gray-400 mb-3 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  /{section.slug}
                </p>

                {/* Schedule info */}
                {(section.startsAt || section.endsAt) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
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

                {section.sectionType === 'PRODUCT_RAIL' && (
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-3 border-b border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {(section as { _count?: { products?: number } })._count?.products ??
                        section.products?.length ?? 0}{' '}
                      {lang === 'vi' ? 'sản phẩm' : 'products'}
                    </span>
                  </div>
                )}

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
                    <Copy className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(section.id) }}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                    title={lang === 'vi' ? 'Xóa' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredSections.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
              <Package className="w-9 h-9 text-stone-400" strokeWidth={1.25} />
            </div>
            <p className="text-gray-500 mb-6">
              {filterType
                ? lang === 'vi' ? 'Không có section nào thuộc loại này' : 'No sections found with this type'
                : lang === 'vi' ? 'Chưa có section nào' : 'No sections yet'}
            </p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              <span>{t('admin.addSection')}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
