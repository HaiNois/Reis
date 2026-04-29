import { useTranslation } from 'react-i18next'
import { Order } from '@/services/orderApi'

interface OrderHeaderProps {
  order: Order
  onCancel?: () => void
  onContact?: () => void
}

export default function OrderHeader({ order, onCancel, onContact }: OrderHeaderProps) {
  const { t, i18n } = useTranslation()
  const canCancel = order.status === 'PENDING'
  const itemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0)

  const placedDate = new Date(order.createdAt).toLocaleDateString(
    i18n.language === 'vi' ? 'vi-VN' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' },
  )

  return (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          {t('order.label')}
        </p>
        <h1 className="font-serif text-3xl md:text-5xl font-light tracking-tight">
          #{order.orderNumber}
        </h1>
        <p className="text-sm italic text-muted-foreground mt-2">
          {t('order.placedOn')} {placedDate} · {t('order.itemsCount', { count: itemsCount })}
        </p>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {canCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs uppercase tracking-wider underline-offset-4 hover:underline transition"
          >
            {t('order.actions.cancel')}
          </button>
        )}
        {onContact && (
          <button
            type="button"
            onClick={onContact}
            className="text-xs uppercase tracking-wider text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition"
          >
            {t('order.actions.contact')}
          </button>
        )}
      </div>
    </header>
  )
}
