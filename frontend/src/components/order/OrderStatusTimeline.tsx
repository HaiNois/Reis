import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
type StepKey = 'placed' | 'shipped' | 'delivered'
type StepState = 'done' | 'current' | 'pending'

interface OrderStatusTimelineProps {
  status: OrderStatus
  createdAt: string
}

// Map enum status -> 3-step timeline (placed | shipped | delivered)
function getStepStates(status: OrderStatus): Record<StepKey, StepState> {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED':
      return { placed: 'current', shipped: 'pending', delivered: 'pending' }
    case 'PROCESSING':
      return { placed: 'done', shipped: 'current', delivered: 'pending' }
    case 'SHIPPED':
      return { placed: 'done', shipped: 'current', delivered: 'pending' }
    case 'DELIVERED':
      return { placed: 'done', shipped: 'done', delivered: 'done' }
    default:
      return { placed: 'done', shipped: 'pending', delivered: 'pending' }
  }
}

export default function OrderStatusTimeline({ status, createdAt }: OrderStatusTimelineProps) {
  const { t, i18n } = useTranslation()
  const states = useMemo(() => getStepStates(status), [status])

  // Branch case: cancelled / refunded → banner instead of timeline
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    const isCancelled = status === 'CANCELLED'
    return (
      <div
        className={cn(
          'border-l-2 px-4 py-3',
          isCancelled
            ? 'border-destructive bg-destructive/5 text-destructive'
            : 'border-muted-foreground bg-muted text-muted-foreground italic',
        )}
        role="status"
      >
        <p className="text-sm uppercase tracking-wider font-medium">
          {t(`order.status.${status.toLowerCase()}`)}
        </p>
        <p className="text-xs mt-1 opacity-80">
          {isCancelled ? t('order.timeline.cancelledNote') : t('order.timeline.refundedNote')}
        </p>
      </div>
    )
  }

  const placedDate = new Date(createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })

  const steps: Array<{ key: StepKey; label: string; date: string | null }> = [
    { key: 'placed', label: t('order.timeline.placed'), date: placedDate },
    { key: 'shipped', label: t('order.timeline.shipped'), date: null },
    { key: 'delivered', label: t('order.timeline.delivered'), date: null },
  ]

  const currentLabel = steps.find((s) => states[s.key] === 'current')?.label ?? t('order.timeline.delivered')

  return (
    <div className="w-full">
      <div className="flex items-start gap-2 md:gap-4">
        {steps.map((step, idx) => {
          const state = states[step.key]
          const isLast = idx === steps.length - 1
          const isDone = state === 'done'
          const isCurrent = state === 'current'

          return (
            <div key={step.key} className="flex-1 flex flex-col items-start">
              {/* Dot + line */}
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    'shrink-0 transition-all',
                    isCurrent
                      ? 'w-3 h-3 bg-foreground ring-4 ring-foreground/10'
                      : isDone
                      ? 'w-3 h-3 bg-foreground'
                      : 'w-3 h-3 border border-foreground/30 bg-background',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                />
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1 h-px ml-2',
                      isDone ? 'bg-foreground' : 'bg-border',
                    )}
                  />
                )}
              </div>

              {/* Label + date */}
              <div className="mt-2 md:mt-3">
                <p
                  className={cn(
                    'text-[10px] md:text-xs uppercase tracking-wider',
                    isDone || isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[10px] md:text-xs italic text-muted-foreground mt-0.5">
                  {step.date ?? '—'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current status caption + tracking placeholder */}
      <div className="mt-6 space-y-1">
        <p className="text-sm">
          <span className="text-muted-foreground">{t('order.timeline.currently')}: </span>
          <span className="font-medium">{currentLabel}</span>
        </p>
        <p className="text-xs text-muted-foreground italic">
          {t('order.timeline.trackingPlaceholder')}
        </p>
      </div>
    </div>
  )
}
