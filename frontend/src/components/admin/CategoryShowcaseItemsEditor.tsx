import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryApi, Category } from '@/services/productApi'
import { homepageSectionApi, HomepageSectionItem, SyncItemInput } from '@/services/homepageApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ==================== TYPES ====================

interface ItemFormState {
  // Carries existing item id for update (undefined = new row)
  id?: string
  categoryId: string
  // Eyebrow VI → stored in item.title
  eyebrowVi: string
  // Eyebrow EN → stored in item.subtitle
  eyebrowEn: string
  // Title override VI → stored in item.description
  titleVi: string
  // Title override EN → stored in metaJson.titleEn
  titleEn: string
  // CTA label VI → stored in item.ctaLabel
  ctaLabelVi: string
  // CTA label EN → stored in metaJson.ctaLabelEn
  ctaLabelEn: string
  ctaUrl: string
  // Optional image override (if empty, backend auto-fetches from first product in category)
  mediaUrl: string
  // Auto-fetched preview from backend (read-only, not submitted)
  previewImage?: string | null
  sortOrder: number
}

const emptyItem = (sortOrder: number): ItemFormState => ({
  categoryId: '',
  eyebrowVi: '',
  eyebrowEn: '',
  titleVi: '',
  titleEn: '',
  ctaLabelVi: '',
  ctaLabelEn: '',
  ctaUrl: '',
  mediaUrl: '',
  previewImage: null,
  sortOrder,
})

// ==================== HELPERS ====================

// Convert ItemFormState → SyncItemInput
function toSyncInput(item: ItemFormState): SyncItemInput {
  return {
    id: item.id,
    itemType: 'COLLECTION',
    title: item.eyebrowVi || null,
    subtitle: item.eyebrowEn || null,
    description: item.titleVi || null,
    mediaUrl: item.mediaUrl || null,
    ctaLabel: item.ctaLabelVi || null,
    ctaUrl: item.ctaUrl || null,
    collectionId: null, // CATEGORY_SHOWCASE uses categoryId in metaJson, not collectionId
    metaJson: {
      categoryId: item.categoryId,
      titleEn: item.titleEn || null,
      ctaLabelEn: item.ctaLabelEn || null,
    },
    isActive: true,
  }
}

// Load existing items from section back into form state
function fromSectionItems(items: HomepageSectionItem[]): ItemFormState[] {
  return items.map((it, idx) => {
    const meta = (it.metaJson ?? {}) as Record<string, string | null>
    return {
      id: it.id,
      categoryId: (meta.categoryId as string) ?? '',
      eyebrowVi: it.title ?? '',
      eyebrowEn: it.subtitle ?? '',
      titleVi: it.description ?? '',
      titleEn: (meta.titleEn as string) ?? '',
      ctaLabelVi: it.ctaLabel ?? '',
      ctaLabelEn: (meta.ctaLabelEn as string) ?? '',
      ctaUrl: it.ctaUrl ?? '',
      mediaUrl: it.mediaUrl ?? '',
      previewImage: it.previewImage ?? null,
      sortOrder: it.sortOrder ?? idx,
    }
  })
}

// ==================== ITEM ROW EDITOR ====================

function ItemRow({
  item,
  index,
  categories,
  lang,
  onChange,
  onRemove,
}: {
  item: ItemFormState
  index: number
  categories: Category[]
  lang: string
  onChange: (updated: ItemFormState) => void
  onRemove: () => void
}) {
  const selectedCategory = categories.find((c) => c.id === item.categoryId)

  // Resolve preview: admin override > auto-fetched previewImage
  const previewSrc = item.mediaUrl || item.previewImage || null

  const set = (patch: Partial<ItemFormState>) => onChange({ ...item, ...patch })

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          {lang === 'vi' ? `Ô ${index + 1}` : `Tile ${index + 1}`}
        </span>
        <div className="flex items-center gap-2">
          {/* Sort order */}
          <Input
            type="number"
            value={item.sortOrder}
            onChange={(e) => set({ sortOrder: Number(e.target.value) })}
            className="w-16 text-center text-sm"
            title={lang === 'vi' ? 'Thứ tự' : 'Sort order'}
          />
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title={lang === 'vi' ? 'Xóa ô' : 'Remove tile'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: category select + image */}
        <div className="space-y-3">
          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs">{lang === 'vi' ? 'Danh mục *' : 'Category *'}</Label>
            <Select
              value={item.categoryId}
              onValueChange={(v) => set({ categoryId: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={lang === 'vi' ? 'Chọn danh mục' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {lang === 'en' && cat.nameEn ? cat.nameEn : cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image URL with auto-fetched preview hint */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {lang === 'vi' ? 'URL ảnh (tùy chọn)' : 'Image URL (optional)'}
            </Label>
            <Input
              type="text"
              value={item.mediaUrl}
              onChange={(e) => set({ mediaUrl: e.target.value })}
              placeholder={
                lang === 'vi'
                  ? 'Để trống → dùng ảnh sản phẩm đầu tiên của danh mục'
                  : 'Leave empty → auto-fetch first product image of category'
              }
            />
            {/* Preview thumbnail */}
            <div className="flex items-start gap-3 mt-2">
              <div className={cn(
                'w-20 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0',
                !previewSrc && 'flex items-center justify-center',
              )}>
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="text-xs text-gray-500 pt-1 leading-relaxed">
                {item.mediaUrl
                  ? (lang === 'vi' ? 'Ảnh admin đã nhập' : 'Admin-provided image')
                  : item.previewImage
                    ? (lang === 'vi' ? 'Ảnh auto-fetch từ sản phẩm đầu tiên' : 'Auto-fetched from first product')
                    : (lang === 'vi'
                        ? selectedCategory
                          ? 'Ảnh sẽ được lấy tự động sau khi lưu'
                          : 'Chọn danh mục để xem preview'
                        : selectedCategory
                          ? 'Image will be auto-fetched after save'
                          : 'Select a category to see preview')
                }
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: text fields */}
        <div className="space-y-3">
          {/* Eyebrow */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{lang === 'vi' ? 'Eyebrow VI' : 'Eyebrow VI'}</Label>
              <Input
                type="text"
                value={item.eyebrowVi}
                onChange={(e) => set({ eyebrowVi: e.target.value })}
                placeholder={lang === 'vi' ? 'VD: Thể loại' : 'e.g. Category'}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{lang === 'vi' ? 'Eyebrow EN' : 'Eyebrow EN'}</Label>
              <Input
                type="text"
                value={item.eyebrowEn}
                onChange={(e) => set({ eyebrowEn: e.target.value })}
                placeholder="e.g. Collection"
              />
            </div>
          </div>

          {/* Title override */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{lang === 'vi' ? 'Tiêu đề VI' : 'Title VI'}</Label>
              <Input
                type="text"
                value={item.titleVi}
                onChange={(e) => set({ titleVi: e.target.value })}
                placeholder={lang === 'vi' ? 'Để trống = tên danh mục' : 'Empty = category name'}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{lang === 'vi' ? 'Tiêu đề EN' : 'Title EN'}</Label>
              <Input
                type="text"
                value={item.titleEn}
                onChange={(e) => set({ titleEn: e.target.value })}
                placeholder="Empty = category name"
              />
            </div>
          </div>

          {/* CTA label */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">CTA VI</Label>
              <Input
                type="text"
                value={item.ctaLabelVi}
                onChange={(e) => set({ ctaLabelVi: e.target.value })}
                placeholder="VD: Xem ngay"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CTA EN</Label>
              <Input
                type="text"
                value={item.ctaLabelEn}
                onChange={(e) => set({ ctaLabelEn: e.target.value })}
                placeholder="e.g. Shop Now"
              />
            </div>
          </div>

          {/* CTA URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">CTA URL</Label>
            <Input
              type="text"
              value={item.ctaUrl}
              onChange={(e) => set({ ctaUrl: e.target.value })}
              placeholder={lang === 'vi' ? 'VD: /products?category=ao-nu' : 'e.g. /products?category=womens'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== MAIN EDITOR ====================

interface Props {
  sectionId: string
  initialItems: HomepageSectionItem[]
}

export default function CategoryShowcaseItemsEditor({ sectionId, initialItems }: Props) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'vi'

  const [items, setItems] = useState<ItemFormState[]>(() => fromSectionItems(initialItems))
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    categoryApi.getCategories()
      .then((res: { data?: Category[] } | Category[]) => {
        const list: Category[] = Array.isArray(res) ? res : (res?.data ?? [])
        setCategories(list)
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))
  }, [])

  const addItem = () => {
    const nextOrder = items.length > 0
      ? Math.max(...items.map((i) => i.sortOrder)) + 1
      : 0
    setItems((prev) => [...prev, emptyItem(nextOrder)])
  }

  const updateItem = (index: number, updated: ItemFormState) => {
    setItems((prev) => prev.map((it, i) => (i === index ? updated : it)))
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    // Validate: every item must have a categoryId
    const invalid = items.findIndex((it) => !it.categoryId)
    if (invalid >= 0) {
      showToast.error(
        lang === 'vi'
          ? `Ô ${invalid + 1} chưa chọn danh mục`
          : `Tile ${invalid + 1} is missing a category`,
      )
      return
    }

    setSaving(true)
    try {
      const payload: SyncItemInput[] = items.map(toSyncInput)
      await homepageSectionApi.syncItems(sectionId, payload)
      showToast.success(lang === 'vi' ? 'Đã lưu danh sách ô' : 'Tiles saved successfully')
    } catch (error) {
      handleApiError(error, lang === 'vi' ? 'Không thể lưu danh sách ô' : 'Failed to save tiles')
    } finally {
      setSaving(false)
    }
  }

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="sm" className="text-gray-500" />
        <span className="ml-2 text-sm text-gray-500">
          {lang === 'vi' ? 'Đang tải danh mục...' : 'Loading categories...'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-sm text-gray-500">
        {lang === 'vi'
          ? 'Mỗi ô liên kết đến 1 danh mục. Ảnh ưu tiên: URL nhập tay → ảnh sản phẩm đầu tiên của danh mục → placeholder.'
          : 'Each tile links to a category. Image priority: manually entered URL → first product image of category → placeholder.'}
      </p>

      {/* Item list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            {lang === 'vi' ? 'Chưa có ô nào. Thêm ô đầu tiên.' : 'No tiles yet. Add the first tile.'}
          </div>
        ) : (
          items.map((item, index) => (
            <ItemRow
              key={index}
              item={item}
              index={index}
              categories={categories}
              lang={lang}
              onChange={(updated) => updateItem(index, updated)}
              onRemove={() => removeItem(index)}
            />
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={addItem} className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {lang === 'vi' ? 'Thêm ô' : 'Add tile'}
        </Button>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving && <Spinner size="sm" className="text-white" />}
          {lang === 'vi' ? 'Lưu danh sách ô' : 'Save tiles'}
        </Button>
      </div>
    </div>
  )
}
