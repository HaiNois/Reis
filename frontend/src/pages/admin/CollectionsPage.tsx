import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { collectionApi, catalogApi, productApi, Collection, Catalog, Product } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'

export default function CollectionsPage() {
  const { t } = useTranslation()
  const [collections, setCollections] = useState<Collection[]>([])
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
    sortOrder: 0,
  })

  useEffect(() => {
    fetchCatalogs()
  }, [])

  useEffect(() => {
    if (selectedCatalogId || catalogs.length > 0) {
      fetchCollections()
    }
  }, [selectedCatalogId, catalogs])

  const fetchCatalogs = async () => {
    try {
      const response = await catalogApi.getAllCatalogs()
      setCatalogs(response.data || [])
      if (response.data && response.data.length > 0 && !selectedCatalogId) {
        setSelectedCatalogId(response.data[0].id)
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch catalogs')
    }
  }

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const response = await collectionApi.getAllCollections(selectedCatalogId || undefined)
      setCollections(response.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch collections')
    } finally {
      setLoading(false)
    }
  }

  const fetchCollectionProducts = async (collectionId: string) => {
    try {
      const response = await collectionApi.getCollectionProducts(collectionId)
      setCollectionProducts(response.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch collection products')
    }
  }

  const openProductModal = async (collection: Collection) => {
    setSelectedCollectionId(collection.id)
    setShowProductModal(true)
    setLoadingProducts(true)
    try {
      // Fetch products already in collection
      const collectionRes = await collectionApi.getCollectionProducts(collection.id)
      setCollectionProducts(collectionRes.data || [])

      // Fetch all available products
      const allProductsRes = await productApi.getProducts({ limit: 100 })
      setAvailableProducts(allProductsRes.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleCatalogChange = (catalogId: string) => {
    setSelectedCatalogId(catalogId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        catalogId: selectedCatalogId,
      }

      if (editingCollection) {
        await collectionApi.updateCollection(editingCollection.id, data)
      } else {
        await collectionApi.createCollection(data)
      }
      setShowModal(false)
      setEditingCollection(null)
      setFormData({
        name: '',
        nameEn: '',
        slug: '',
        description: '',
        image: '',
        isActive: true,
        sortOrder: 0,
      })
      fetchCollections()
    } catch (error) {
      handleApiError(error, 'Failed to save collection')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return
    try {
      await collectionApi.deleteCollection(id)
      fetchCollections()
    } catch (error) {
      handleApiError(error, 'Failed to delete collection')
    }
  }

  const openEdit = (collection: Collection) => {
    setEditingCollection(collection)
    setFormData({
      name: collection.name,
      nameEn: collection.nameEn || '',
      slug: collection.slug,
      description: collection.description || '',
      image: collection.image || '',
      isActive: collection.isActive,
      sortOrder: collection.sortOrder || 0,
    })
    setShowModal(true)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  if (loading && collections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.collections')}</h2>
        <button
          onClick={() => {
            setEditingCollection(null)
            setFormData({
              name: '',
              nameEn: '',
              slug: '',
              description: '',
              image: '',
              isActive: true,
              sortOrder: 0,
            })
            setShowModal(true)
          }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          + {t('admin.addCollection')}
        </button>
      </div>

      {/* Catalog Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Catalog
        </label>
        <select
          value={selectedCatalogId}
          onChange={(e) => handleCatalogChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg w-64"
        >
          {catalogs.map((catalog) => (
            <option key={catalog.id} value={catalog.id}>
              {catalog.name}
            </option>
          ))}
        </select>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sort Order</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {collections.map((collection) => (
              <tr key={collection.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{collection.name}</div>
                  {collection.nameEn && (
                    <div className="text-sm text-gray-500">{collection.nameEn}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500">{collection.slug}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    collection.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {collection.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{collection.sortOrder || 0}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openProductModal(collection)}
                    className="text-green-600 hover:text-green-800 mr-3"
                  >
                    Products
                  </button>
                  <button
                    onClick={() => openEdit(collection)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(collection.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
            {collections.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No collections found. Add your first collection!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingCollection ? t('admin.editCollection') : t('admin.addCollection')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Manage Products in Collection
              </h3>

              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Products in this collection:</h4>
                    {collectionProducts.length === 0 ? (
                      <p className="text-gray-500 text-sm">No products in this collection yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {collectionProducts.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{product.name}</span>
                            <button
                              onClick={() => {
                                // Remove from collection
                                setCollectionProducts(collectionProducts.filter(p => p.id !== product.id))
                              }}
                              className="text-red-600 text-sm hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Add products:</h4>
                    <div className="max-h-48 overflow-y-auto border rounded">
                      {availableProducts
                        .filter(p => !collectionProducts.find(cp => cp.id === p.id))
                        .map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setCollectionProducts([...collectionProducts, product])
                            }}
                          >
                            <span className="text-sm">{product.name}</span>
                            <span className="text-green-600 text-sm">+ Add</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // Save collection products - need backend API
                      showToast.info('Product management feature coming soon')
                      setShowProductModal(false)
                    } catch (error) {
                      handleApiError(error, 'Failed to save collection products')
                    }
                  }}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}