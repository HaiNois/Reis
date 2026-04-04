import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { t } = useTranslation()
  const { items, updateQuantity, removeItem, getTotal } = useCartStore()

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-lg">{t('cart.title')}</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">{t('cart.empty')}</p>
              <p className="text-sm text-muted-foreground">{t('cart.emptyDesc')}</p>
            </div>
            <Button asChild onClick={onClose}>
              <Link to="/products">{t('cart.continueShopping')}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={item.variantId}
                  className={cn(
                    "flex gap-4 p-4",
                    index !== items.length - 1 && "border-b"
                  )}
                >
                  <div className="w-20 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {item.image && item.image !== '/images/products/placeholder.jpg' ? (
                      <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-sm leading-tight">{item.productName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>
                    </div>
                    <div className="flex items-end justify-between gap-2 mt-2">
                      <span className="text-sm font-medium">
                        {item.price.toLocaleString('vi-VN')} ₫
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                        >
                          <span className="sr-only">Decrease</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => updateQuantity(item.variantId, Math.min(item.maxQuantity, item.quantity + 1))}
                        >
                          <span className="sr-only">Increase</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeItem(item.variantId)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>

            <SheetFooter className="p-6 pt-4 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                  <span>{getTotal().toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.shipping')}</span>
                  <span>{t('common.free')}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>{t('cart.total')}</span>
                  <span>{getTotal().toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild size="lg" onClick={onClose}>
                  <Link to="/checkout">{t('cart.checkout')}</Link>
                </Button>
                <Button asChild variant="outline" onClick={onClose}>
                  <Link to="/cart">{t('cart.viewCart')}</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}