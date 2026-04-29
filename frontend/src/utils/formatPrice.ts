// Display-only price formatter. Real charging uses backend variant.priceUsd directly.
// FALLBACK_RATE is used when an item is missing priceUsd (legacy data) and the
// active locale is English. The actual paid amount on PayPal still comes from
// the stored priceUsd, never this rate.
export const FALLBACK_USD_RATE = 25000

export function isEnglish(language: string | undefined | null): boolean {
  return !!language && language.toLowerCase().startsWith('en')
}

export function formatPrice(
  vnd: number | string | null | undefined,
  usd: number | string | null | undefined,
  language: string,
): string {
  const vndNum = Number(vnd) || 0

  if (isEnglish(language)) {
    const usdNum =
      usd !== null && usd !== undefined && usd !== ''
        ? Number(usd)
        : vndNum / FALLBACK_USD_RATE
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdNum || 0)
  }

  return `${vndNum.toLocaleString('vi-VN')} ₫`
}
