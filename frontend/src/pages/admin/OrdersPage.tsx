import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ColumnDef } from '@tanstack/react-table'
import { orderApi, Order } from '@/services/orderApi'
import { showToast, handleApiError } from '@/utils/toast'
import { Spinner } from '@/components/ui/spinner'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye } from 'lucide-react'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
}

// Define columns for orders table
const orderColumns = (handleStatusChange: (orderId: string, status: string) => void): ColumnDef<Order>[] => [
  {
    accessorKey: 'orderNumber',
    header: 'Order #',
    cell: ({ row }) => <span className="font-medium">{row.original.orderNumber}</span>,
  },
  {
    accessorKey: 'shippingName',
    header: 'Customer',
    cell: ({ row }) => (
      <div>
        <div>{row.original.shippingFirstName} {row.original.shippingLastName}</div>
        <div className="text-sm text-muted-foreground">{row.original.shippingPhone}</div>
      </div>
    ),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => <span>{Number(row.original.total).toLocaleString('vi-VN')} ₫</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <select
        value={row.original.status}
        onChange={(e) => handleStatusChange(row.original.id, e.target.value)}
        className={`px-2 py-1 text-xs rounded-full border-0 cursor-pointer ${statusColors[row.original.status]}`}
      >
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="PROCESSING">Processing</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => <span className="text-sm">{new Date(row.original.createdAt).toLocaleDateString('vi-VN')}</span>,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: () => (
      <div className="text-right">
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </div>
    ),
  },
]

export default function OrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = filter ? { status: filter } : {}
      const response = await orderApi.getAllOrders(params)
      setOrders(response.data || [])
    } catch (error) {
      handleApiError(error, 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await orderApi.updateOrderStatus(orderId, status)
      showToast.success('Order status updated')
      fetchOrders()
    } catch (error) {
      handleApiError(error, 'Failed to update order status')
    }
  }

  if (loading) {
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
          <CardTitle className="text-2xl font-bold">{t('admin.orders')}</CardTitle>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={orderColumns(handleStatusChange)}
            data={orders}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}