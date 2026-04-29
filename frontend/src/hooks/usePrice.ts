import { useTranslation } from 'react-i18next'
import { formatPrice, isEnglish } from '@/utils/formatPrice'

/**
 * Returns a price formatter bound to the current i18n language.
 * Components using this hook auto re-render when the user switches language.
 *
 * Usage:
 *   const fmt = usePrice()
 *   <span>{fmt(product.price, product.priceUsd)}</span>
 */
export function usePrice() {
  const { i18n } = useTranslation()
  const language = i18n.language

  const fmt = (
    vnd: number | string | null | undefined,
    usd?: number | string | null,
  ) => formatPrice(vnd, usd, language)

  fmt.isEn = isEnglish(language)
  fmt.language = language

  return fmt
}
