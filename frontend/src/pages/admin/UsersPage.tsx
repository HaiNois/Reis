import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { userApi, AdminUser, UserRole } from '@/services/userApi'
import { useAuthStore } from '@/stores/authStore'
import { showToast, handleApiError } from '@/utils/toast'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Spinner } from '@/components/ui/spinner'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  CUSTOMER: 'bg-blue-100 text-blue-800',
}

interface EditFormState {
  firstName: string
  lastName: string
  phone: string
  role: UserRole
}

const emptyForm: EditFormState = {
  firstName: '',
  lastName: '',
  phone: '',
  role: 'CUSTOMER',
}

export default function UsersPage() {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const currentUser = useAuthStore((state) => state.user)

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState<'' | UserRole>('')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState<EditFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await userApi.listUsers({
        limit: 100,
        ...(search ? { search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      })
      setUsers(response.data || [])
    } catch (error) {
      handleApiError(error, t('admin.errors.fetchUsersFailed'))
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      role: user.role,
    })
  }

  const closeEdit = () => {
    setEditingUser(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      setSubmitting(true)
      await userApi.updateUser(editingUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone.trim() ? formData.phone.trim() : null,
        role: formData.role,
      })
      showToast.success(t('admin.userUpdated'))
      closeEdit()
      fetchUsers()
    } catch (error) {
      handleApiError(error, t('admin.errors.updateUserFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      showToast.error(t('admin.errors.cannotDeleteSelf'))
      return
    }

    const confirmed = await confirm({
      type: 'warning',
      title: t('admin.deleteUser'),
      description: t('admin.deleteUserConfirm', { email: user.email }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
    })
    if (!confirmed) return

    try {
      await userApi.deleteUser(user.id)
      showToast.success(t('admin.userDeleted'))
      fetchUsers()
    } catch (error) {
      handleApiError(error, t('admin.errors.deleteUserFailed'))
    }
  }

  const columns: ColumnDef<AdminUser>[] = useMemo(
    () => [
      {
        accessorKey: 'email',
        header: t('admin.email'),
        cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
      },
      {
        id: 'name',
        header: t('admin.name'),
        cell: ({ row }) => (
          <span>
            {row.original.firstName} {row.original.lastName}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: t('admin.phone'),
        cell: ({ row }) => <span>{row.original.phone || '—'}</span>,
      },
      {
        accessorKey: 'role',
        header: t('admin.role'),
        cell: ({ row }) => (
          <span className={`px-2 py-1 text-xs rounded-full ${roleColors[row.original.role]}`}>
            {row.original.role}
          </span>
        ),
      },
      {
        id: 'orders',
        header: t('admin.totalOrders'),
        cell: ({ row }) => <span>{row.original._count.orders}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: t('admin.createdAt'),
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.createdAt).toLocaleDateString('vi-VN')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{t('common.actions')}</div>,
        cell: ({ row }) => {
          const isSelf = row.original.id === currentUser?.id
          return (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
                <Pencil className="h-4 w-4 mr-1" />
                {t('common.edit')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row.original)}
                disabled={isSelf}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('common.delete')}
              </Button>
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, currentUser?.id]
  )

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">{t('admin.users')}</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder={t('admin.searchUsers')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="sm:w-64"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as '' | UserRole)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('admin.allRoles')}</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={users} pageSize={10} />
        </CardContent>
      </Card>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {t('admin.editUser')}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{editingUser.email}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('admin.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('admin.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('admin.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{t('admin.role')}</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                    disabled={editingUser.id === currentUser?.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  {editingUser.id === currentUser?.id && (
                    <p className="text-xs text-gray-500">{t('admin.cannotChangeOwnRole')}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={closeEdit} disabled={submitting}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Spinner size="sm" /> : t('common.save')}
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
