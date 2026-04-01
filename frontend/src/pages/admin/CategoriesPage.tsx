import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryApi, Category } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function CategoriesPage() {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.id, formData)
      } else {
        await categoryApi.createCategory(formData)
      }
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', slug: '', description: '', image: '' })
      fetchCategories()
    } catch (error) {
      handleApiError(error, 'Failed to save category')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: 'warning',
      title: 'Delete Category',
      description: 'Are you sure you want to delete this category? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    if (!confirmed) return
    try {
      await categoryApi.deleteCategory(id)
      fetchCategories()
    } catch (error) {
      handleApiError(error, 'Failed to delete category')
    }
  }

  const openEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
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
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <button
          onClick={() => {
            setEditingCategory(null)
            setFormData({ name: '', slug: '', description: '', image: '' })
            setShowModal(true)
          }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          + Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow overflow-hidden">
            {category.image && (
              <img src={category.image} alt={category.name} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-500">{category.slug}</p>
              {category.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{category.description}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">
                  {category.products?.length || 0} products
                </span>
                <div>
                  <button
                    onClick={() => openEdit(category)}
                    className="text-blue-600 hover:text-blue-800 mr-3 text-sm"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No categories found. Add your first category!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
                    })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                  />
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