import { describe, expect, it } from 'vitest'
import { FALLBACK_RATES, convertUsd, formatMoney, isCurrencyCode, mergeRates } from './currency'

describe('currency helpers', () => {
  it('validates supported currency codes', () => {
    expect(isCurrencyCode('EUR')).toBe(true)
    expect(isCurrencyCode('JPY')).toBe(false)
  })

  it('converts and formats USD amounts', () => {
    expect(convertUsd(100, 'EUR', FALLBACK_RATES)).toBe(92)
    expect(formatMoney(10, 'USD', FALLBACK_RATES)).toBe('$10.00')
  })

  it('merges remote rates with safe fallbacks', () => {
    const rates = mergeRates({ EUR: 0.9, GBP: 'bad', CAD: 1.4, AUD: 1.5 })
    expect(rates.EUR).toBe(0.9)
    expect(rates.GBP).toBe(FALLBACK_RATES.GBP)
    expect(rates.USD).toBe(1)
  })
})
