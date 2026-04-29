// Admin CMS page for managing announcement bar messages
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Truck,
  Gift,
  Sparkles,
  ShieldCheck,
  Tag,
  Clock,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/components/providers/confirm-provider'
import { showToast, handleApiError } from '@/utils/toast'
import { cn } from '@/lib/utils'
import {
  announcementApi,
  type AnnouncementMessageEntity,
  type CreateAnnouncementMessageDto,
} from '@/services/announcementApi'

// ==================== CONSTANTS ====================

const ICON_OPTIONS = [
  { value: 'truck', label: 'Truck', Icon: Truck },
  { value: 'gift', label: 'Gift', Icon: Gift },
  { value: 'sparkle', label: 'Sparkle', Icon: Sparkles },
  { value: 'shield', label: 'Shield', Icon: ShieldCheck },
  { value: 'tag', label: 'Tag', Icon: Tag },
  { value: 'clock', label: 'Clock', Icon: Clock },
] as const

const VARIANT_OPTIONS = [
  { value: 'dark', label: 'Dark', previewClass: 'bg-gray-900 text-white' },
  { value: 'light', label: 'Light', previewClass: 'bg-gray-100 text-gray-900' },
  { value: 'accent', label: 'Accent', previewClass: 'bg-black text-white' },
] as const

// ==================== FORM SCHEMA ====================

const formSchema = z.object({
  textVi: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
  textEn: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
  icon: z.string().nullable().optional(),
  ctaTextVi: z.string().max(60).nullable().optional(),
  ctaTextEn: z.string().max(60).nullable().optional(),
  ctaHref: z.string().nullable().optional(),
  variant: z.enum(['dark', 'light', 'accent']),
  isActive: z.boolean(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ==================== HELPERS ====================

function VariantBadge({ variant }: { variant: string }) {
  const cls = VARIANT_OPTIONS.find(v => v.value === variant)?.previewClass ?? 'bg-gray-100'
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider', cls)}>
      {variant}
    </span>
  )
}

function IconPreview({ icon }: { icon: string | null }) {
  if (!icon) return <span className="text-gray-400 text-xs">—</span>
  const found = ICON_OPTIONS.find(o => o.value === icon)
  if (!found) return <span className="text-gray-400 text-xs">{icon}</span>
  const { Icon } = found
  return <Icon className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

// ==================== FORM MODAL ====================

interface MessageFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editingMessage: AnnouncementMessageEntity | null
  lang: string
}

function MessageFormModal({ open, onClose, onSaved, editingMessage, lang }: MessageFormModalProps) {
  const isEdit = editingMessage !== null
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      textVi: '',
      textEn: '',
      icon: null,
      ctaTextVi: null,
      ctaTextEn: null,
      ctaHref: null,
      variant: 'dark',
      isActive: true,
      startsAt: null,
      endsAt: null,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (editingMessage) {
      reset({
        textVi: editingMessage.textVi,
        textEn: editingMessage.textEn,
        icon: editingMessage.icon,
        ctaTextVi: editingMessage.ctaTextVi,
        ctaTextEn: editingMessage.ctaTextEn,
        ctaHref: editingMessage.ctaHref,
        variant: editingMessage.variant,
        isActive: editingMessage.isActive,
        startsAt: editingMessage.startsAt ? editingMessage.startsAt.slice(0, 16) : null,
        endsAt: editingMessage.endsAt ? editingMessage.endsAt.slice(0, 16) : null,
      })
    } else {
      reset({
        textVi: '',
        textEn: '',
        icon: null,
        ctaTextVi: null,
        ctaTextEn: null,
        ctaHref: null,
        variant: 'dark',
        isActive: true,
        startsAt: null,
        endsAt: null,
      })
    }
  }, [editingMessage, open, reset])

  if (!open) return null

  const watchedIcon = watch('icon')
  const watchedVariant = watch('variant')
  const watchedIsActive = watch('isActive')

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      const payload: CreateAnnouncementMessageDto = {
        textVi: values.textVi,
        textEn: values.textEn,
        icon: values.icon || null,
        ctaTextVi: values.ctaTextVi || null,
        ctaTextEn: values.ctaTextEn || null,
        ctaHref: values.ctaHref || null,
        variant: values.variant,
        isActive: values.isActive,
        startsAt: values.startsAt || null,
        endsAt: values.endsAt || null,
      }

      if (isEdit && editingMessage) {
        await announcementApi.updateMessage(editingMessage.id, payload)
        showToast.success(lang === 'vi' ? 'Cập nhật thành công' : 'Updated successfully')
      } else {
        await announcementApi.createMessage(payload)
        showToast.success(lang === 'vi' ? 'Tạo thành công' : 'Created successfully')
      }

      onSaved()
      onClose()
    } catch (error) {
      handleApiError(error, lang === 'vi' ? 'Lỗi khi lưu' : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    // Modal backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit
        ? (lang === 'vi' ? 'Sửa tin nhắn' : 'Edit message')
        : (lang === 'vi' ? 'Thêm tin nhắn' : 'Add message')
      }
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">
            {isEdit
              ? (lang === 'vi' ? 'Sửa thông báo' : 'Edit Announcement')
              : (lang === 'vi' ? 'Thêm thông báo' : 'Add Announcement')
            }
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            aria-label={lang === 'vi' ? 'Đóng' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Text Vietnamese */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
                {lang === 'vi' ? 'Nội dung (Tiếng Việt)' : 'Content (Vietnamese)'}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                {...register('textVi')}
                rows={2}
                maxLength={200}
                placeholder="Miễn phí vận chuyển cho đơn từ 2.000.000đ"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/20 transition-shadow',
                  errors.textVi ? 'border-red-400' : 'border-gray-300'
                )}
              />
              {errors.textVi && (
                <p className="text-red-500 text-xs mt-1">{errors.textVi.message}</p>
              )}
            </div>

            {/* Text English */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
                {lang === 'vi' ? 'Nội dung (Tiếng Anh)' : 'Content (English)'}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                {...register('textEn')}
                rows={2}
                maxLength={200}
                placeholder="Free shipping on orders over 2,000,000 VND"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/20 transition-shadow',
                  errors.textEn ? 'border-red-400' : 'border-gray-300'
                )}
              />
              {errors.textEn && (
                <p className="text-red-500 text-xs mt-1">{errors.textEn.message}</p>
              )}
            </div>

            {/* Icon picker */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
                {lang === 'vi' ? 'Icon' : 'Icon'}
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setValue('icon', null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs transition-all',
                    !watchedIcon
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                >
                  {lang === 'vi' ? 'Không có' : 'None'}
                </button>
                {ICON_OPTIONS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('icon', value)}
                    title={label}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all',
                      watchedIcon === value
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA fields */}
            <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {lang === 'vi' ? 'Nút kêu gọi (tuỳ chọn)' : 'CTA (optional)'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    {lang === 'vi' ? 'Label VI' : 'Label VI'}
                  </label>
                  <input
                    type="text"
                    {...register('ctaTextVi')}
                    maxLength={60}
                    placeholder="Mua ngay"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    {lang === 'vi' ? 'Label EN' : 'Label EN'}
                  </label>
                  <input
                    type="text"
                    {...register('ctaTextEn')}
                    maxLength={60}
                    placeholder="Shop Now"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {lang === 'vi' ? 'Liên kết (href)' : 'Link (href)'}
                </label>
                <input
                  type="text"
                  {...register('ctaHref')}
                  placeholder="/products"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>
            </div>

            {/* Variant */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
                {lang === 'vi' ? 'Giao diện (Variant)' : 'Variant'}
              </label>
              <div className="flex gap-2">
                {VARIANT_OPTIONS.map(({ value, label, previewClass }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('variant', value)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                      watchedVariant === value
                        ? 'border-black ring-1 ring-black'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                  >
                    <span className={cn('w-4 h-4 rounded', previewClass)} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* isActive toggle */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                {lang === 'vi' ? 'Kích hoạt' : 'Active'}
              </span>
              <button
                type="button"
                onClick={() => setValue('isActive', !watchedIsActive)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/20',
                  watchedIsActive ? 'bg-black' : 'bg-gray-300'
                )}
                role="switch"
                aria-checked={watchedIsActive}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                    watchedIsActive ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Schedule */}
            <div className="mb-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {lang === 'vi' ? 'Ngày bắt đầu' : 'Starts At'}
                </label>
                <input
                  type="datetime-local"
                  {...register('startsAt')}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {lang === 'vi' ? 'Ngày kết thúc' : 'Ends At'}
                </label>
                <input
                  type="datetime-local"
                  {...register('endsAt')}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {lang === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <Button
            type="submit"
            form="announcement-form"
            disabled={saving}
            className="gap-2"
          >
            {saving && <Spinner size="sm" />}
            {isEdit
              ? (lang === 'vi' ? 'Cập nhật' : 'Update')
              : (lang === 'vi' ? 'Tạo mới' : 'Create')
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==================== MAIN PAGE ====================

export default function AnnouncementBarPage() {
  const { i18n } = useTranslation()
  const { confirm } = useConfirm()
  const lang = i18n.language || 'vi'

  const [messages, setMessages] = useState<AnnouncementMessageEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMessage, setEditingMessage] = useState<AnnouncementMessageEntity | null>(null)

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const data = await announcementApi.getMessages()
      // Sort by sortOrder ascending
      setMessages([...data].sort((a, b) => a.sortOrder - b.sortOrder))
    } catch (error) {
      handleApiError(
        error,
        lang === 'vi' ? 'Không thể tải danh sách thông báo' : 'Failed to fetch announcements'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMessage(null)
    setModalOpen(true)
  }

  const handleEdit = (msg: AnnouncementMessageEntity) => {
    setEditingMessage(msg)
    setModalOpen(true)
  }

  const handleDelete = async (msg: AnnouncementMessageEntity) => {
    const confirmed = await confirm({
      type: 'warning',
      title: lang === 'vi' ? 'Xóa thông báo' : 'Delete Announcement',
      description: lang === 'vi'
        ? `Bạn có chắc muốn xóa thông báo "${msg.textVi}"? Hành động này không thể hoàn tác.`
        : `Are you sure you want to delete "${msg.textEn}"? This cannot be undone.`,
      confirmText: lang === 'vi' ? 'Xóa' : 'Delete',
      cancelText: lang === 'vi' ? 'Hủy' : 'Cancel',
    })
    if (!confirmed) return

    try {
      await announcementApi.deleteMessage(msg.id)
      showToast.success(lang === 'vi' ? 'Đã xóa thông báo' : 'Announcement deleted')
      fetchMessages()
    } catch (error) {
      handleApiError(error, lang === 'vi' ? 'Không thể xóa thông báo' : 'Failed to delete')
    }
  }

  const handleToggleActive = async (msg: AnnouncementMessageEntity) => {
    try {
      await announcementApi.updateMessage(msg.id, { isActive: !msg.isActive })
      // Optimistic update
      setMessages(prev =>
        prev.map(m => m.id === msg.id ? { ...m, isActive: !m.isActive } : m)
      )
    } catch (error) {
      handleApiError(
        error,
        lang === 'vi' ? 'Không thể thay đổi trạng thái' : 'Failed to toggle status'
      )
    }
  }

  /**
   * Move item up or down in sort order.
   * Sends PATCH /sort after computing new sortOrder values.
   */
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= messages.length) return

    const newMessages = [...messages]
    // Swap positions
    ;[newMessages[index], newMessages[swapIndex]] = [newMessages[swapIndex], newMessages[index]]

    // Reassign sortOrder sequentially
    const reordered = newMessages.map((m, i) => ({ ...m, sortOrder: i + 1 }))
    setMessages(reordered)

    try {
      await announcementApi.sortMessages(
        reordered.map(m => ({ id: m.id, sortOrder: m.sortOrder }))
      )
    } catch (error) {
      handleApiError(error, lang === 'vi' ? 'Không thể sắp xếp lại' : 'Failed to reorder')
      // Revert on failure
      fetchMessages()
    }
  }

  // ===== RENDER =====

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {lang === 'vi' ? 'Announcement Bar' : 'Announcement Bar'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'vi'
              ? 'Quản lý các thông báo hiển thị trên thanh đầu trang'
              : 'Manage messages displayed on the top announcement bar'}
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>{lang === 'vi' ? 'Thêm thông báo' : 'Add Announcement'}</span>
        </Button>
      </div>

      {/* Preview strip */}
      <div className="mb-6 rounded-lg overflow-hidden border">
        <div className="bg-gray-900 text-white text-[11px] font-light tracking-[0.18em] uppercase h-9 flex items-center justify-center px-8">
          {messages.find(m => m.isActive)?.textVi ?? (lang === 'vi' ? '(Chưa có thông báo nào active)' : '(No active announcements)')}
        </div>
        <div className="bg-gray-50 px-4 py-1.5 text-xs text-gray-400 border-t">
          {lang === 'vi' ? 'Preview thanh thông báo (thông báo đầu tiên active)' : 'Announcement bar preview (first active message)'}
        </div>
      </div>

      {/* Messages table */}
      {messages.length === 0 ? (
        // Empty state
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Tag className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-gray-500 mb-2 font-medium">
            {lang === 'vi' ? 'Chưa có thông báo nào' : 'No announcements yet'}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {lang === 'vi' ? 'Tạo thông báo đầu tiên cho thanh banner' : 'Create your first announcement banner message'}
          </p>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Thêm thông báo' : 'Add Announcement'}</span>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  {lang === 'vi' ? 'Thứ tự' : 'Order'}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === 'vi' ? 'Nội dung' : 'Content'}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Icon
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Variant
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  {lang === 'vi' ? 'Trạng thái' : 'Status'}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  {lang === 'vi' ? 'Lịch' : 'Schedule'}
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  {lang === 'vi' ? 'Thao tác' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg, index) => (
                <tr
                  key={msg.id}
                  className={cn(
                    'border-b last:border-b-0 transition-colors',
                    msg.isActive ? 'hover:bg-gray-50' : 'hover:bg-gray-50 opacity-60'
                  )}
                >
                  {/* Sort order + move buttons */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-gray-400 font-mono">{msg.sortOrder}</span>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === messages.length - 1}
                        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Content */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{msg.textVi}</p>
                    <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">{msg.textEn}</p>
                    {msg.ctaHref && (
                      <p className="text-blue-500 text-xs mt-0.5 truncate">
                        {msg.ctaTextVi} → {msg.ctaHref}
                      </p>
                    )}
                  </td>

                  {/* Icon */}
                  <td className="px-4 py-3">
                    <IconPreview icon={msg.icon} />
                  </td>

                  {/* Variant */}
                  <td className="px-4 py-3">
                    <VariantBadge variant={msg.variant} />
                  </td>

                  {/* Active toggle */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(msg)}
                      className={cn(
                        'relative px-3 py-1 text-xs font-medium rounded-full transition-all',
                        msg.isActive
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          msg.isActive ? 'bg-white' : 'bg-gray-400'
                        )} />
                        {msg.isActive
                          ? (lang === 'vi' ? 'Active' : 'Active')
                          : (lang === 'vi' ? 'Tắt' : 'Off')
                        }
                      </span>
                    </button>
                  </td>

                  {/* Schedule */}
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {msg.startsAt || msg.endsAt ? (
                      <span>
                        {msg.startsAt ? formatDateShort(msg.startsAt) : '—'}
                        {' → '}
                        {msg.endsAt ? formatDateShort(msg.endsAt) : '—'}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(msg)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                        aria-label={lang === 'vi' ? 'Sửa' : 'Edit'}
                      >
                        <Pencil className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(msg)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label={lang === 'vi' ? 'Xóa' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      <MessageFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchMessages}
        editingMessage={editingMessage}
        lang={lang}
      />
    </div>
  )
}
