import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Lock,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  ImageOff,
  Trash2,
} from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import { usePrice } from '@/hooks/usePrice'
import { useConfirm } from '@/components/providers/confirm-provider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function CartPage() {
  const { t } = useTranslation()
  const fmt = usePrice()
  const { confirm } = useConfirm()
  const { items, updateQuantity, removeItem, clearCart, getTotal, getTotalUsd, getItemCount } =
    useCartStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const checkoutHref = isAuthenticated
    ? '/checkout'
    : `/login?redirect=${encodeURIComponent('/checkout')}`

  const itemCount = getItemCount()

  const handleQtyChange = (variantId: string, nextQty: number) => {
    if (nextQty <= 0) {
      removeItem(variantId)
      return
    }
    updateQuantity(variantId, nextQty)
  }

  const handleClearCart = async () => {
    const ok = await confirm({
      type: 'warning',
      title: t('cart.confirmClearTitle'),
      description: t('cart.confirmClearDesc'),
      confirmText: t('cart.clearCart'),
      cancelText: t('common.cancel'),
    })
    if (ok) clearCart()
  }

  // ---------- Empty state ----------
  if (items.length === 0) {
    return (
      <div className="container-custom py-16 md:py-24">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-stone-400" strokeWidth={1.25} />
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500 mb-3">
            {t('cart.title')}
          </p>
          <h1 className="font-serif font-light text-3xl md:text-4xl tracking-tight mb-3">
            {t('cart.empty')}
          </h1>
          <p className="text-stone-600 italic mb-8">{t('cart.emptyDesc')}</p>
          <Button asChild className="rounded-none px-10 py-6 uppercase tracking-wider text-xs">
            <Link to="/products">{t('cart.continueShopping')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ---------- Items state ----------
  return (
    <div className="container-custom py-8 md:py-12 lg:py-16">
      {/* Header — eyebrow + serif heading */}
      <header className="mb-8 md:mb-12">
        <p className="text-xs uppercase tracking-[0.25em] text-stone-500 mb-2">
          {t('cart.title')}
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-serif font-light text-3xl md:text-5xl tracking-tight">
            {t('cart.title')}
          </h1>
          <p className="text-sm italic text-stone-500">
            {t('cart.subtitleCount', { count: itemCount })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* ============ Items list ============ */}
        <section className="lg:col-span-7">
          <ul className="border-y divide-y">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity
              const lineTotalUsd =
                item.priceUsd != null ? Number(item.priceUsd) * item.quantity : null
              const atMax = item.quantity >= item.maxQuantity
              const stockLow = item.maxQuantity - item.quantity <= 3 && item.maxQuantity > 0

              const NameWrapper = item.productSlug
                ? ({ children }: { children: React.ReactNode }) => (
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="hover:text-stone-500 transition-colors"
                    >
                      {children}
                    </Link>
                  )
                : ({ children }: { children: React.ReactNode }) => <>{children}</>

              return (
                <li key={item.variantId} className="py-6 md:py-8">
                  <div className="flex gap-4 md:gap-6">
                    {/* Image */}
                    <div className="w-24 md:w-32 aspect-[3/4] bg-stone-100 flex-shrink-0 overflow-hidden">
                      {item.image && !item.image.endsWith('placeholder.jpg') ? (
                        item.productSlug ? (
                          <Link to={`/products/${item.productSlug}`} className="block w-full h-full">
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            />
                          </Link>
                        ) : (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <ImageOff className="w-8 h-8" strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-serif text-base md:text-lg leading-tight truncate">
                            <NameWrapper>{item.productName}</NameWrapper>
                          </h3>
                          <p className="text-xs italic text-stone-500 mt-1">{item.variantName}</p>
                          <p className="text-sm text-stone-700 mt-2 tabular-nums">
                            {fmt(item.price, item.priceUsd)}
                          </p>
                        </div>

                        {/* Line total — large, right-aligned (desktop) */}
                        <p className="hidden md:block font-medium tabular-nums whitespace-nowrap">
                          {fmt(lineTotal, lineTotalUsd)}
                        </p>
                      </div>

                      {/* Stock indicator */}
                      {atMax ? (
                        <p className="text-xs text-amber-700">{t('cart.stockReached')}</p>
                      ) : stockLow ? (
                        <p className="text-xs text-amber-700">
                          {t('cart.stockLeft', { count: item.maxQuantity })}
                        </p>
                      ) : null}

                      {/* Qty + Remove row */}
                      <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                        {/* Qty stepper */}
                        <div
                          className="inline-flex items-center border border-stone-300"
                          aria-label={t('cart.updateQuantity')}
                        >
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.variantId, item.quantity - 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={t('cart.decrease')}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                          <span className="w-9 text-center text-sm tabular-nums select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.variantId, item.quantity + 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={t('cart.increase')}
                            disabled={atMax}
                          >
                            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>

                        {/* Mobile line total */}
                        <p className="md:hidden font-medium tabular-nums whitespace-nowrap text-sm">
                          {fmt(lineTotal, lineTotalUsd)}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-900 underline-offset-4 hover:underline transition-colors"
                        >
                          {t('cart.remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Cart utility row — Continue shopping + Clear cart */}
          <div className="flex items-center justify-between gap-3 mt-6">
            <Link
              to="/products"
              className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900 underline-offset-4 hover:underline transition-colors"
            >
              ← {t('cart.continueShopping')}
            </Link>
            <button
              type="button"
              onClick={handleClearCart}
              className="text-xs uppercase tracking-wider text-stone-500 hover:text-red-600 inline-flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t('cart.clearCart')}
            </button>
          </div>
        </section>

        {/* ============ Summary panel ============ */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <div className="bg-stone-50 border border-stone-200 p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-stone-500 mb-4">
                {t('cart.summary')}
              </p>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-600">
                    {t('cart.subtotal')}
                    <span className="text-stone-400 ml-1">
                      ({t('cart.subtitleCount', { count: itemCount })})
                    </span>
                  </dt>
                  <dd className="tabular-nums">{fmt(getTotal(), getTotalUsd())}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-600">{t('cart.shipping')}</dt>
                  <dd className="italic text-emerald-700">{t('common.free')}</dd>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-base pt-1">
                  <dt>{t('cart.total')}</dt>
                  <dd className="tabular-nums">{fmt(getTotal(), getTotalUsd())}</dd>
                </div>
              </dl>

              <Link
                to={checkoutHref}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white py-4 text-xs uppercase tracking-[0.2em] transition-colors"
              >
                {!isAuthenticated && (
                  <Lock className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                )}
                <span>
                  {isAuthenticated ? t('cart.checkout') : t('auth.loginToCheckout')}
                </span>
              </Link>

              {/* Trust signals */}
              <div className="mt-6 pt-6 border-t border-stone-200 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-stone-600">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                  <span>{t('cart.secureCheckout')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-stone-600">
                  <Truck className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                  <span>{t('cart.freeShippingNote')}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
