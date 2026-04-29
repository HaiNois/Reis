import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { orderApi, Order, OrderItem } from '@/services/orderApi'
import { productApi, getMainImageUrl, FALLBACK_IMAGE } from '@/services/productApi'
import { useCartStore } from '@/stores/cartStore'
import { showToast, handleApiError } from '@/utils/toast'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import OrderHeader from '@/components/order/OrderHeader'
import OrderStatusTimeline from '@/components/order/OrderStatusTimeline'
import OrderItemRow from '@/components/order/OrderItemRow'
import OrderSummaryPanel from '@/components/order/OrderSummaryPanel'
import OrderActions from '@/components/order/OrderActions'
import OrderDetailSkeleton from '@/components/order/OrderDetailSkeleton'

const SUPPORT_EMAIL = 'support@reis.example'

export default function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const { t } = useTranslation()
  const { addItem, openCart } = useCartStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'not_found' | 'load_failed' | null>(null)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [reordering, setReordering] = useState(false)

  const fetchOrder = useCallback(async () => {
    if (!orderNumber) return
    setLoading(true)
    setError(null)
    try {
      const res = await orderApi.getOrderByNumber(orderNumber)
      setOrder(res.data ?? res)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(status === 404 ? 'not_found' : 'load_failed')
    } finally {
      setLoading(false)
    }
  }, [orderNumber])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleCancel = async () => {
    if (!order) return
    setCancelling(true)
    try {
      await orderApi.cancelOrder(order.id)
      showToast.success(t('order.actions.cancelSuccess'))
      setConfirmCancelOpen(false)
      await fetchOrder()
    } catch (err) {
      handleApiError(err, t('order.actions.cancelFailed'))
    } finally {
      setCancelling(false)
    }
  }

  // Reorder: check stock per variant, skip out-of-stock, partial-add when limited
  const handleReorder = async () => {
    if (!order || reordering) return
    setReordering(true)
    try {
      // Group items by productSlug to minimize API calls
      const uniqueSlugs = Array.from(
        new Set(order.items.map((i) => i.productSlug).filter((s): s is string => Boolean(s))),
      )

      // Fetch all unique products in parallel
      const productResponses = await Promise.allSettled(
        uniqueSlugs.map((slug) => productApi.getProductBySlug(slug)),
      )

      // Build map: variantId -> { stock, productMeta }
      const variantStockMap = new Map<
        string,
        { quantity: number; productImage: string; productId: string; productName: string }
      >()
      productResponses.forEach((res) => {
        if (res.status !== 'fulfilled') return
        const product = res.value?.data ?? res.value
        if (!product?.variants) return
        const productImage = getMainImageUrl(product.images || [])
        product.variants.forEach((v: { id: string; quantity: number }) => {
          variantStockMap.set(v.id, {
            quantity: v.quantity,
            productImage,
            productId: product.id,
            productName: product.name,
          })
        })
      })

      let addedCount = 0
      const outOfStockNames: string[] = []
      const partialNames: string[] = []

      order.items.forEach((item: OrderItem) => {
        const stockInfo = variantStockMap.get(item.variantId)
        const stock = stockInfo?.quantity ?? 0
        const label = `${item.productName}${item.variantName ? ` (${item.variantName})` : ''}`

        if (stock <= 0) {
          outOfStockNames.push(label)
          return
        }

        const qtyToAdd = Math.min(item.quantity, stock)
        if (qtyToAdd < item.quantity) partialNames.push(label)

        addItem(
          {
            variantId: item.variantId,
            productId: stockInfo?.productId ?? item.productId ?? '',
            productSlug: item.productSlug,
            productName: item.productName,
            variantName: item.variantName,
            price: Number(item.unitPrice),
            image: stockInfo?.productImage || item.productImage || FALLBACK_IMAGE,
            maxQuantity: stock,
          },
          qtyToAdd,
        )
        addedCount += qtyToAdd
      })

      if (addedCount > 0) {
        showToast.success(t('order.actions.reorderSuccess', { count: addedCount }))
        openCart()
      }
      if (outOfStockNames.length > 0) {
        showToast.warning(t('order.actions.reorderOutOfStock', { names: outOfStockNames.join(', ') }))
      }
      if (partialNames.length > 0) {
        showToast.warning(t('order.actions.reorderPartial', { names: partialNames.join(', ') }))
      }
      if (addedCount === 0 && outOfStockNames.length === 0) {
        showToast.error(t('order.actions.reorderFailed'))
      }
    } catch (err) {
      handleApiError(err, t('order.actions.reorderFailed'))
    } finally {
      setReordering(false)
    }
  }

  const handleContact = () => {
    if (!order) return
    const subject = encodeURIComponent(`Order ${order.orderNumber}`)
    const body = encodeURIComponent(
      `Hello,\n\nI need help with my order ${order.orderNumber}.\n\n`,
    )
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
  }

  if (loading) return <OrderDetailSkeleton />

  if (error || !order) {
    return (
      <div className="container-custom py-16 md:py-24 max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          {t('order.label')}
        </p>
        <h1 className="font-serif text-2xl md:text-3xl font-light mb-3">
          {error === 'not_found' ? t('order.errors.notFound') : t('order.errors.loadFailed')}
        </h1>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" className="rounded-none" onClick={fetchOrder}>
            {t('order.errors.tryAgain')}
          </Button>
          <Button asChild className="rounded-none">
            <Link to="/account/orders">{t('account.myOrders')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container-custom py-8 md:py-12 pb-24 lg:pb-12">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/account">{t('account.profile')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/account/orders">{t('account.myOrders')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>#{order.orderNumber}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <OrderHeader
          order={order}
          onCancel={() => setConfirmCancelOpen(true)}
          onContact={handleContact}
        />

        <Separator className="mb-8" />

        {/* Timeline */}
        <div className="mb-10 max-w-3xl">
          <OrderStatusTimeline status={order.status} createdAt={order.createdAt} />
        </div>

        <Separator className="mb-8" />

        {/* 2-col content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Items */}
          <section className="lg:col-span-2">
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {t('order.sections.items')} ({order.items.length})
            </h2>
            <div className="divide-y">
              {order.items.map((item) => (
                <OrderItemRow key={item.id} item={item} />
              ))}
            </div>

            {/* Inline desktop actions */}
            <OrderActions
              order={order}
              onReorder={handleReorder}
              onCancel={() => setConfirmCancelOpen(true)}
              isReordering={reordering}
              variant="inline"
            />
          </section>

          {/* Summary panel */}
          <OrderSummaryPanel order={order} />
        </div>
      </div>

      {/* Mobile sticky actions */}
      <OrderActions
        order={order}
        onReorder={handleReorder}
        onCancel={() => setConfirmCancelOpen(true)}
        isReordering={reordering}
        variant="sticky"
      />

      {/* Confirm cancel dialog */}
      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('order.actions.confirmCancelTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('order.actions.confirmCancelDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              {t('common.cancel') || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelling}>
              {cancelling ? t('common.processing') || 'Processing...' : t('order.actions.cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
