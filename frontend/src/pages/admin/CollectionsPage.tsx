import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import { collectionApi, catalogApi, productApi, Collection, Catalog, Product } from '@/services/productApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, Package, Plus } from 'lucide-react'

// Define columns for collections table
const collectionColumns = (t: Function, openProductModal: (collection: Collection) => void, openEdit: (collection: Collection) => void, handleDelete: (id: string) => void): ColumnDef<Collection>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        {row.original.nameEn && (
          <div className="text-sm text-muted-foreground">{row.original.nameEn}</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <span>{row.original.slug}</span>,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'outline'} className={row.original.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    accessorKey: 'sortOrder',
    header: 'Sort Order',
    cell: ({ row }) => <span>{row.original.sortOrder || 0}</span>,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <Button variant="ghost" size="sm" onClick={() => openProductModal(row.original)} className="mr-2">
          <Package className="h-4 w-4 mr-1" />
          Products
        </Button>
        <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)} className="mr-2">
          <Pencil className="h-4 w-4 mr-1" />
          {t('common.edit')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)} className="text-red-600 hover:text-red-800">
          <Trash2 className="h-4 w-4 mr-1" />
          {t('common.delete')}
        </Button>
      </div>
    ),
  },
]

export default function CollectionsPage() {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
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
    const confirmed = await confirm({
      type: 'warning',
      title: 'Delete Collection',
      description: 'Are you sure you want to delete this collection? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    if (!confirmed) return
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
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">{t('admin.collections')}</CardTitle>
          <Button onClick={() => { setEditingCollection(null); setFormData({ name: '', nameEn: '', slug: '', description: '', image: '', isActive: true, sortOrder: 0 }); setShowModal(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addCollection')}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Catalog Filter */}
          <div className="mb-4">
            <Label htmlFor="catalogSelect" className="mb-2">
              Select Catalog
            </Label>
            <select
              id="catalogSelect"
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
          <DataTable
            columns={collectionColumns(t, openProductModal, openEdit, handleDelete)}
            data={collections}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? t('admin.editCollection') : t('admin.addCollection')}
            </DialogTitle>
          </DialogHeader>
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
                      slug: generateSlug(e.target.value)
                    })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameEn">Name (English)</Label>
                  <Input
                    id="nameEn"
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
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
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
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
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      </div>
    )
  }