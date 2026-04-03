import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { feedbackApi, Feedback } from '@/services/homepageApi'
import { handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function FeedbackPage() {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    customerRole: '',
    content: '',
    avatarUrl: '',
    rating: 5,
    isFeatured: false,
    isActive: true,
    sortOrder: 0,
  })

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    try {
      const response = await feedbackApi.getFeedback({ limit: 100 })
      setFeedbackList(response.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch feedback')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFeedback) {
        await feedbackApi.updateFeedback(editingFeedback.id, formData)
      } else {
        await feedbackApi.createFeedback(formData)
      }
      setShowModal(false)
      resetForm()
      fetchFeedback()
    } catch (error) {
      handleApiError(error, 'Failed to save feedback')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: 'Delete Feedback',
      description: 'Are you sure you want to delete this feedback?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    if (!confirmed) return
    try {
      await feedbackApi.deleteFeedback(id)
      fetchFeedback()
    } catch (error) {
      handleApiError(error, 'Failed to delete feedback')
    }
  }

  const handleToggleFeatured = async (feedback: Feedback) => {
    try {
      await feedbackApi.updateFeedback(feedback.id, { isFeatured: !feedback.isFeatured })
      fetchFeedback()
    } catch (error) {
      handleApiError(error, 'Failed to toggle featured')
    }
  }

  const handleToggleActive = async (feedback: Feedback) => {
    try {
      await feedbackApi.updateFeedback(feedback.id, { isActive: !feedback.isActive })
      fetchFeedback()
    } catch (error) {
      handleApiError(error, 'Failed to toggle active')
    }
  }

  const resetForm = () => {
    setEditingFeedback(null)
    setFormData({
      customerName: '',
      customerRole: '',
      content: '',
      avatarUrl: '',
      rating: 5,
      isFeatured: false,
      isActive: true,
      sortOrder: 0,
    })
  }

  const openEdit = (feedback: Feedback) => {
    setEditingFeedback(feedback)
    setFormData({
      customerName: feedback.customerName,
      customerRole: feedback.customerRole || '',
      content: feedback.content,
      avatarUrl: feedback.avatarUrl || '',
      rating: feedback.rating,
      isFeatured: feedback.isFeatured,
      isActive: feedback.isActive,
      sortOrder: feedback.sortOrder,
    })
    setShowModal(true)
  }

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
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.feedback')}</h2>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          + {t('admin.addFeedback')}
        </button>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbackList.map((feedback) => (
          <div key={feedback.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {feedback.avatarUrl ? (
                    <img src={feedback.avatarUrl} alt={feedback.customerName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-gray-500">
                      {feedback.customerName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{feedback.customerName}</h4>
                  {feedback.customerRole && (
                    <p className="text-sm text-gray-500">{feedback.customerRole}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFeatured(feedback)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    feedback.isFeatured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {t('admin.featured')}
                </button>
                <button
                  onClick={() => handleToggleActive(feedback)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    feedback.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {feedback.isActive ? t('common.active') : t('common.inactive')}
                </button>
              </div>
            </div>
            <p className="mt-4 text-gray-600">{feedback.content}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEdit(feedback)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {t('common.edit')}
              </button>
              <button
                onClick={() => handleDelete(feedback.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
        {feedbackList.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {t('admin.noFeedback')}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingFeedback ? t('admin.editFeedback') : t('admin.addFeedback')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">
                      {t('admin.customerName')} *
                    </Label>
                    <Input
                      id="customerName"
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerRole">
                      {t('admin.customerRole')}
                    </Label>
                    <Input
                      id="customerRole"
                      type="text"
                      value={formData.customerRole}
                      onChange={(e) => setFormData({ ...formData, customerRole: e.target.value })}
                      placeholder="e.g. VIP Customer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">
                    {t('admin.content')} *
                  </Label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">
                    {t('admin.avatarUrl')}
                  </Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">
                      {t('admin.rating')}
                    </Label>
                    <select
                      id="rating"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {[1, 2, 3, 4, 5].map((r) => (
                        <option key={r} value={r}>{r} ★</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">
                      {t('admin.sortOrder')}
                    </Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isFeatured" className="text-sm text-gray-700">
                      {t('admin.featured')}
                    </Label>
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
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
