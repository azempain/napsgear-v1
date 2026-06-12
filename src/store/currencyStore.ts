import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  FALLBACK_RATES,
  formatMoney,
  type CurrencyCode,
  type CurrencyRates,
} from '@/lib/currency'

type CurrencyState = {
  currency: CurrencyCode
  rates: CurrencyRates
  fetchedAt: number
  setCurrency: (currency: CurrencyCode) => void
  setRates: (rates: CurrencyRates, fetchedAt: number) => void
  money: (usdAmount: number) => string
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      rates: FALLBACK_RATES,
      fetchedAt: 0,
      setCurrency: currency => set({ currency }),
      setRates: (rates, fetchedAt) => set({ rates, fetchedAt }),
      money: usdAmount => {
        const { currency, rates } = get()
        return formatMoney(usdAmount, currency, rates)
      },
    }),
    {
      name: 'napsgear_currency',
      partialize: state => ({
        currency: state.currency,
        rates: state.rates,
        fetchedAt: state.fetchedAt,
      }),
    },
  ),
)
