import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import {
  collectionApi,
  productApi,
  Collection,
  Product,
} from "@/services/productApi";
import { showToast, handleApiError } from "@/utils/toast";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Package, Plus, Search } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

// Define columns for collections table
const collectionColumns = (
  t: Function,
  openProductModal: (collection: Collection) => void,
  openEdit: (collection: Collection) => void,
  handleDelete: (id: string) => void,
): ColumnDef<Collection>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        {row.original.nameEn && (
          <div className="text-sm text-muted-foreground">
            {row.original.nameEn}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.slug}</span>
    ),
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) =>
      row.original.image ? (
        <img
          src={row.original.image}
          alt=""
          className="w-12 h-12 object-cover rounded"
        />
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.isActive ? "default" : "outline"}
        className={
          row.original.isActive
            ? "bg-green-100 text-green-800 hover:bg-green-100"
            : ""
        }
      >
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openProductModal(row.original)}
        >
          <Package className="h-4 w-4 mr-1" />
          {t("common.products")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openEdit(row.original)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(row.original.id)}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

export default function CollectionsPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [collectionProductIds, setCollectionProductIds] = useState<Set<string>>(
    new Set(),
  );
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    slug: "",
    description: "",
    image: "",
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionApi.getAllCollections();
      setCollections(response.data || []);
    } catch (error) {
      handleApiError(error, "Failed to fetch collections");
    } finally {
      setLoading(false);
    }
  };

  const openProductModal = async (collection: Collection) => {
    setSelectedCollection(collection);
    setShowProductModal(true);
    setLoadingProducts(true);
    setProductSearch("");
    try {
      // Fetch products already in collection
      const collectionRes = await collectionApi.getCollectionProducts(
        collection.id,
      );
      setCollectionProductIds(
        new Set((collectionRes.data || []).map((p: Product) => p.id)),
      );

      // Fetch all available products
      const allProductsRes = await productApi.getProducts({ limit: 100 });
      setAvailableProducts(allProductsRes.data || []);
    } catch (error) {
      handleApiError(error, "Failed to fetch products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollection) {
        await collectionApi.updateCollection(editingCollection.id, formData);
        showToast.success("Collection updated successfully");
      } else {
        await collectionApi.createCollection(formData);
        showToast.success("Collection created successfully");
      }
      setShowModal(false);
      setEditingCollection(null);
      setFormData({
        name: "",
        nameEn: "",
        slug: "",
        description: "",
        image: "",
        isActive: true,
        sortOrder: 0,
      });
      fetchCollections();
    } catch (error) {
      handleApiError(error, "Failed to save collection");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      type: "warning",
      title: t("admin.deleteCollection"),
      description: t("admin.deleteCollectionConfirm"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (!confirmed) return;
    try {
      await collectionApi.deleteCollection(id);
      showToast.success(t("admin.collectionDeleted"));
      fetchCollections();
    } catch (error) {
      handleApiError(error, t("admin.failedDeleteCollection"));
    }
  };

  const openEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      nameEn: collection.nameEn || "",
      slug: collection.slug,
      description: collection.description || "",
      image: collection.image || "",
      isActive: collection.isActive,
      sortOrder: collection.sortOrder || 0,
    });
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const resetForm = () => {
    setEditingCollection(null);
    setFormData({
      name: "",
      nameEn: "",
      slug: "",
      description: "",
      image: "",
      isActive: true,
      sortOrder: 0,
    });
  };

  const toggleProduct = (productId: string) => {
    const newSelectedIds = new Set(collectionProductIds);
    if (newSelectedIds.has(productId)) {
      newSelectedIds.delete(productId);
    } else {
      newSelectedIds.add(productId);
    }
    setCollectionProductIds(newSelectedIds);
  };

  const toggleSelectAll = () => {
    if (collectionProductIds.size === filteredProducts.length) {
      setCollectionProductIds(new Set());
    } else {
      setCollectionProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleAddSelectedProducts = async () => {
    if (!selectedCollection || collectionProductIds.size === 0) return;

    try {
      const productIds = Array.from(collectionProductIds);
      await collectionApi.addProductToCollection(
        selectedCollection.id,
        productIds,
      );
      showToast.success(t("admin.productsAdded"));
      setShowProductModal(false);
    } catch (error) {
      handleApiError(error, t("admin.failedAddProduct"));
    }
  };

  const handleRemoveSelectedProducts = async () => {
    if (!selectedCollection || collectionProductIds.size === 0) return;

    try {
      const productIds = Array.from(collectionProductIds);
      await collectionApi.removeProductsFromCollection(
        selectedCollection.id,
        productIds,
      );
      showToast.success(t("admin.productsRemoved"));
      setShowProductModal(false);
    } catch (error) {
      handleApiError(error, t("admin.failedRemoveProduct"));
    }
  };

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase()),
  );

  if (loading && collections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">
            {t("admin.collections")}
          </CardTitle>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("admin.addCollection")}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={collectionColumns(
              t,
              openProductModal,
              openEdit,
              handleDelete,
            )}
            data={collections}
            pageSize={10}
            onRowDoubleClick={(collection) =>
              openEdit(collection as Collection)
            }
          />
        </CardContent>
      </Card>

      {/* Collection Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCollection
                ? t("admin.editCollection")
                : t("admin.addCollection")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.collectionName")} *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">{t("admin.collectionNameEn")}</Label>
              <Input
                id="nameEn"
                type="text"
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t("admin.slug")} *</Label>
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("admin.description")}</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.image")}</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">{t("admin.sortOrder")}</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t("admin.status")}</Label>
                <select
                  id="status"
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.value === "true",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="true">{t("common.active")}</option>
                  <option value="false">{t("common.inactive")}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Selection Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("admin.selectProducts")} - {selectedCollection?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("admin.searchProducts")}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products List */}
          {loadingProducts ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" className="text-black" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left w-10">
                      <input
                        type="checkbox"
                        checked={
                          collectionProductIds.size ===
                            filteredProducts.length &&
                          filteredProducts.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">
                      {t("admin.product")}
                    </th>
                    <th className="px-3 py-2 text-left">
                      {t("admin.category")}
                    </th>
                    <th className="px-3 py-2 text-right">{t("admin.price")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const isSelected = collectionProductIds.has(product.id);
                    return (
                      <tr
                        key={product.id}
                        className={`border-t cursor-pointer hover:bg-gray-50 ${isSelected ? "bg-green-50" : ""}`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProduct(product.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            {product.images?.[0]?.publicUrl || product.image ? (
                              <img
                                src={
                                  product.images?.[0]?.publicUrl ||
                                  product.image
                                }
                                alt=""
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded" />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-gray-500">
                                {product.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {product.category?.name || "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(product.price).toLocaleString("vi-VN")} ₫
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-8 text-center text-gray-500"
                      >
                        {t("admin.noProductsFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-4">
            <span className="text-sm text-muted-foreground self-center">
              {collectionProductIds.size} {t("admin.productsSelected")}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowProductModal(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveSelectedProducts}
                disabled={collectionProductIds.size === 0}
              >
                {t("admin.removeSelectedProducts")}
              </Button>
              <Button
                onClick={handleAddSelectedProducts}
                disabled={collectionProductIds.size === 0}
              >
                {t("admin.addSelectedProducts")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
