import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

// Tonal palette — sharp edges, no rounded
const styleByStatus: Record<OrderStatus, string> = {
  PENDING: 'bg-muted text-foreground border border-border',
  CONFIRMED: 'bg-foreground text-background',
  PROCESSING: 'bg-foreground text-background',
  SHIPPED: 'bg-transparent border border-foreground text-foreground',
  DELIVERED: 'bg-foreground text-background',
  CANCELLED: 'bg-destructive/10 text-destructive border border-destructive/30',
  REFUNDED: 'bg-muted text-muted-foreground italic border border-border',
}

export default function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs uppercase tracking-wider',
        styleByStatus[status],
        className,
      )}
    >
      {status === 'DELIVERED' && <Check className="w-3 h-3" />}
      {t(`order.status.${status.toLowerCase()}`)}
    </span>
  )
}
