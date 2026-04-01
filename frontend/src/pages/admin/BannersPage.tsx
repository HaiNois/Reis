import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { bannerApi, Banner } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function BannersPage() {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    position: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await bannerApi.getAllBanners()
      setBanners(response.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch banners')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBanner) {
        await bannerApi.updateBanner(editingBanner.id, formData)
      } else {
        await bannerApi.createBanner(formData)
      }
      setShowModal(false)
      setEditingBanner(null)
      setFormData({
        title: '',
        subtitle: '',
        image: '',
        link: '',
        position: 0,
        isActive: true,
      })
      fetchBanners()
    } catch (error) {
      handleApiError(error, 'Failed to save banner')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: 'Delete Banner',
      description: 'Are you sure you want to delete this banner?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    if (!confirmed) return
    try {
      await bannerApi.deleteBanner(id)
      fetchBanners()
    } catch (error) {
      handleApiError(error, 'Failed to delete banner')
    }
  }

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image: banner.image,
      link: banner.link || '',
      position: banner.position,
      isActive: banner.isActive,
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
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.banners')}</h2>
        <button
          onClick={() => {
            setEditingBanner(null)
            setFormData({
              title: '',
              subtitle: '',
              image: '',
              link: '',
              position: banners.length,
              isActive: true,
            })
            setShowModal(true)
          }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          + Add Banner
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-lg shadow overflow-hidden">
            <img src={banner.image} alt={banner.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {banner.subtitle && (
                <p className="text-sm text-gray-500 mt-1">{banner.subtitle}</p>
              )}
              <p className="text-sm text-gray-400 mt-2">Position: {banner.position}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <button
                  onClick={() => openEdit(banner)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No banners found. Add your first banner!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingBanner ? 'Edit Banner' : 'Add Banner'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    required
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link">Link (optional)</Label>
                  <Input
                    id="link"
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/products"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      type="number"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center mt-6">
                    <Label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      Active
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