import { Link } from 'react-router-dom'
import { OrderItem } from '@/services/orderApi'
import { FALLBACK_IMAGE } from '@/services/productApi'
import { usePrice } from '@/hooks/usePrice'

interface OrderItemRowProps {
  item: OrderItem
}

export default function OrderItemRow({ item }: OrderItemRowProps) {
  const fmt = usePrice()
  const imageSrc = item.productImage || FALLBACK_IMAGE
  const productHref = item.productSlug ? `/products/${item.productSlug}` : null
  const totalPriceUsd = (item as any).totalPriceUsd as number | null | undefined

  const ImageEl = (
    <div className="shrink-0 w-20 h-[107px] md:w-24 md:h-32 bg-muted overflow-hidden">
      <img
        src={imageSrc}
        alt={`${item.productName}${item.variantName ? ` — ${item.variantName}` : ''}`}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  )

  const NameEl = (
    <span className="font-medium text-sm md:text-base hover:underline underline-offset-4">
      {item.productName}
    </span>
  )

  return (
    <article className="flex gap-4 md:gap-6 py-6">
      {productHref ? <Link to={productHref}>{ImageEl}</Link> : ImageEl}

      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-start md:justify-between gap-2">
        <div className="min-w-0">
          {productHref ? <Link to={productHref}>{NameEl}</Link> : NameEl}
          {item.variantName && (
            <p className="text-sm text-muted-foreground italic mt-1">{item.variantName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">Qty {item.quantity}</p>
        </div>

        <p className="text-sm tabular-nums shrink-0 md:text-right">
          {fmt(Number(item.totalPrice), totalPriceUsd)}
        </p>
      </div>
    </article>
  )
}
