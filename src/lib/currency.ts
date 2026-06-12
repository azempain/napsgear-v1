export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]
export type CurrencyRates = Record<CurrencyCode, number>

export const FALLBACK_RATES: CurrencyRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.37,
  AUD: 1.52,
}

export function isCurrencyCode(value: string | null): value is CurrencyCode {
  return value !== null && SUPPORTED_CURRENCIES.includes(value as CurrencyCode)
}

export function convertUsd(amount: number, currency: CurrencyCode, rates: CurrencyRates): number {
  return amount * rates[currency]
}

export function formatMoney(amount: number, currency: CurrencyCode, rates: CurrencyRates): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertUsd(amount, currency, rates))
}

export function mergeRates(input: unknown): CurrencyRates {
  if (!input || typeof input !== 'object') return FALLBACK_RATES
  const source = input as Record<string, unknown>
  return SUPPORTED_CURRENCIES.reduce<CurrencyRates>((rates, code) => {
    const value = code === 'USD' ? 1 : source[code]
    rates[code] = typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : FALLBACK_RATES[code]
    return rates
  }, { ...FALLBACK_RATES })
}
