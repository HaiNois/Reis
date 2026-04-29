import { useTranslation } from 'react-i18next'
import { Order } from '@/services/orderApi'
import { usePrice } from '@/hooks/usePrice'
import { Separator } from '@/components/ui/separator'

interface OrderSummaryPanelProps {
  order: Order
}

const paymentMethodKey: Record<Order['paymentMethod'], string> = {
  COD: 'order.payment.cod',
  BANK_TRANSFER: 'order.payment.bankTransfer',
}

const paymentStatusKey: Record<Order['paymentStatus'], string> = {
  PENDING: 'order.payment.statusPending',
  PAID: 'order.payment.statusPaid',
  FAILED: 'order.payment.statusFailed',
  REFUNDED: 'order.payment.statusRefunded',
}

export default function OrderSummaryPanel({ order }: OrderSummaryPanelProps) {
  const { t } = useTranslation()
  const fmt = usePrice()
  const subtotal = Number(order.subtotal)
  const shipping = Number(order.shippingFee)
  const total = Number(order.total)
  // Optional USD fields (backend may not always ship). When missing, formatter falls back.
  const subtotalUsd = (order as any).subtotalUsd as number | null | undefined
  const shippingUsd = (order as any).shippingFeeUsd as number | null | undefined
  const totalUsd = (order as any).totalUsd as number | null | undefined

  return (
    <aside className="lg:sticky lg:top-24 space-y-0">
      {/* Summary */}
      <section className="py-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          {t('order.sections.summary')}
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('cart.subtotal')}</dt>
            <dd className="tabular-nums">{fmt(subtotal, subtotalUsd)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('order.shippingFee')}</dt>
            <dd className="tabular-nums">
              {shipping === 0 ? <span className="italic">{t('common.free')}</span> : fmt(shipping, shippingUsd)}
            </dd>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between font-medium text-base pt-1">
            <dt>{t('cart.total')}</dt>
            <dd className="tabular-nums">{fmt(total, totalUsd)}</dd>
          </div>
        </dl>
      </section>

      <Separator />

      {/* Payment */}
      <section className="py-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          {t('order.sections.payment')}
        </h2>
        <p className="text-sm">{t(paymentMethodKey[order.paymentMethod])}</p>
        <p className="text-xs text-muted-foreground italic mt-1">
          {t('order.statusLabel')}: {t(paymentStatusKey[order.paymentStatus])}
        </p>
      </section>

      <Separator />

      {/* Ship to */}
      <section className="py-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          {t('order.sections.shipTo')}
        </h2>
        <address className="not-italic text-sm space-y-0.5 leading-relaxed">
          <p className="font-medium">
            {order.shippingFirstName} {order.shippingLastName}
          </p>
          <p className="text-muted-foreground">{order.shippingPhone}</p>
          <p className="text-muted-foreground">{order.shippingAddress}</p>
          <p className="text-muted-foreground">
            {order.shippingCity}
            {order.shippingCountry ? `, ${order.shippingCountry}` : ''}
          </p>
        </address>
      </section>

      {order.notes && (
        <>
          <Separator />
          <section className="py-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              {t('order.sections.notes')}
            </h2>
            <p className="text-sm italic text-muted-foreground">{order.notes}</p>
          </section>
        </>
      )}
    </aside>
  )
}
