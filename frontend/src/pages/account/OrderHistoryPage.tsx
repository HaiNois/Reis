import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ChevronRight, PackageOpen } from 'lucide-react'
import { orderApi, Order } from '@/services/orderApi'
import { usePrice } from '@/hooks/usePrice'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import OrderStatusBadge from '@/components/order/OrderStatusBadge'

type StatusFilter = '' | Order['status']

const STATUS_TABS: StatusFilter[] = [
  '',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

const PAGE_SIZE = 10

interface OrdersListResponse {
  data: Order[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export default function OrderHistoryPage() {
  const { t, i18n } = useTranslation()
  const fmt = usePrice()
  const [status, setStatus] = useState<StatusFilter>('')
  const [page, setPage] = useState(1)

  const query = useQuery<OrdersListResponse>({
    queryKey: ['my-orders', { status, page }],
    queryFn: async () => {
      const res = await orderApi.getOrders({
        status: status || undefined,
        page,
        limit: PAGE_SIZE,
      })
      return res as OrdersListResponse
    },
    placeholderData: keepPreviousData,
  })

  const orders = query.data?.data ?? []
  const meta = query.data?.meta
  const totalPages = meta?.totalPages ?? 1

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const itemsCount = (o: Order) => o.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="container-custom py-8 md:py-12">
      {/* Header */}
      <header className="mb-8 md:mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          {t('account.profile')}
        </p>
        <h1 className="font-serif text-3xl md:text-5xl font-light tracking-tight mb-2">
          {t('order.history.title')}
        </h1>
        <p className="text-sm italic text-muted-foreground">
          {t('order.history.subtitle')}
        </p>
      </header>

      {/* Status filter tabs */}
      <nav
        className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1"
        aria-label={t('order.filters.label') ?? 'Filter by status'}
      >
        {STATUS_TABS.map((s) => {
          const active = status === s
          const label =
            s === '' ? t('order.filters.all') : t(`order.status.${s.toLowerCase()}`)
          return (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => {
                setStatus(s)
                setPage(1)
              }}
              className={`whitespace-nowrap text-xs uppercase tracking-wider px-3 py-1.5 border transition ${
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
              }`}
            >
              {label}
            </button>
          )
        })}
      </nav>

      {/* States */}
      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ul className="divide-y border-y">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/account/orders/${order.orderNumber}`}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center py-5 md:py-6 hover:bg-muted/30 transition-colors -mx-2 px-2"
                >
                  {/* Order number + date */}
                  <div className="md:col-span-4 min-w-0">
                    <p className="font-serif text-base md:text-lg leading-tight">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  {/* Items count */}
                  <p className="md:col-span-3 text-sm text-muted-foreground">
                    {t('order.history.itemsLabel', { count: itemsCount(order) })}
                  </p>

                  {/* Total */}
                  <p className="md:col-span-2 text-sm font-medium tabular-nums md:text-right">
                    {fmt(Number(order.total), (order as any).totalUsd)}
                  </p>

                  {/* Status + chevron */}
                  <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3">
                    <OrderStatusBadge status={order.status} />
                    <ChevronRight
                      className="w-4 h-4 text-muted-foreground hidden md:block group-hover:translate-x-0.5 transition-transform"
                      strokeWidth={1.5}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                className="rounded-none"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('order.history.previous')}
              </Button>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t('order.history.page', { current: page, total: totalPages })}
              </p>
              <Button
                variant="outline"
                className="rounded-none"
                disabled={page >= totalPages || query.isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t('order.history.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// --- Sub-components ---

function ListSkeleton() {
  return (
    <ul className="divide-y border-y">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center py-6 animate-pulse"
        >
          <div className="md:col-span-4 space-y-2">
            <div className="h-4 w-40 bg-muted" />
            <div className="h-3 w-24 bg-muted/70" />
          </div>
          <div className="md:col-span-3 h-3 w-20 bg-muted/70" />
          <div className="md:col-span-2 h-4 w-24 bg-muted md:ml-auto" />
          <div className="md:col-span-3 h-6 w-24 bg-muted md:ml-auto" />
        </li>
      ))}
    </ul>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="border border-dashed py-16 px-4 text-center max-w-xl mx-auto">
      <PackageOpen
        className="w-10 h-10 mx-auto text-muted-foreground mb-4"
        strokeWidth={1.25}
      />
      <p className="font-serif text-xl font-light mb-2">{t('account.noOrders')}</p>
      <Separator className="w-12 mx-auto my-4" />
      <Button asChild className="rounded-none mt-2">
        <Link to="/products">{t('order.history.shopNow')}</Link>
      </Button>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="border border-dashed py-16 px-4 text-center max-w-xl mx-auto">
      <p className="font-serif text-xl font-light mb-2">
        {t('order.errors.loadFailed')}
      </p>
      <Button variant="outline" className="rounded-none mt-4" onClick={onRetry}>
        {t('order.errors.tryAgain')}
      </Button>
    </div>
  )
}
