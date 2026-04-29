import { useTranslation } from 'react-i18next'
import { Order } from '@/services/orderApi'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OrderActionsProps {
  order: Order
  onReorder: () => void
  onCancel: () => void
  isReordering?: boolean
  variant?: 'inline' | 'sticky'
}

export default function OrderActions({
  order,
  onReorder,
  onCancel,
  isReordering = false,
  variant = 'inline',
}: OrderActionsProps) {
  const { t } = useTranslation()
  const canCancel = order.status === 'PENDING'
  const isClosed = order.status === 'CANCELLED' || order.status === 'REFUNDED'

  if (variant === 'sticky') {
    if (isClosed && !canCancel) return null
    return (
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-background border-t px-4 py-3 flex gap-2">
        {!isClosed && (
          <Button
            variant="outline"
            className="flex-1 rounded-none"
            onClick={onReorder}
            disabled={isReordering}
          >
            {t('order.actions.reorder')}
          </Button>
        )}
        {canCancel && (
          <Button
            variant="default"
            className="flex-1 rounded-none"
            onClick={onCancel}
          >
            {t('order.actions.cancel')}
          </Button>
        )}
      </div>
    )
  }

  // Inline variant: under items list (desktop)
  return (
    <div className={cn('hidden lg:flex items-center gap-3 mt-6')}>
      {!isClosed && (
        <Button
          variant="outline"
          className="rounded-none"
          onClick={onReorder}
          disabled={isReordering}
        >
          {t('order.actions.reorder')}
        </Button>
      )}
    </div>
  )
}
