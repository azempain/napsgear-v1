'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  FALLBACK_RATES,
  formatMoney,
  isCurrencyCode,
  mergeRates,
  type CurrencyCode,
  type CurrencyRates,
} from '@/lib/currency'

const CURRENCY_KEY = 'napsgear_currency'
const RATES_KEY = 'napsgear_currency_rates'
const RATE_TTL = 12 * 60 * 60 * 1000
const RATE_URL = 'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD,AUD'

type CurrencyContextValue = {
  currency: CurrencyCode
  rates: CurrencyRates
  setCurrency: (currency: CurrencyCode) => void
  money: (usdAmount: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export default function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD')
  const [rates, setRates] = useState<CurrencyRates>(FALLBACK_RATES)

  useEffect(() => {
    const savedCurrency = localStorage.getItem(CURRENCY_KEY)
    if (isCurrencyCode(savedCurrency)) setCurrencyState(savedCurrency)

    const savedRates = localStorage.getItem(RATES_KEY)
    if (savedRates) {
      try {
        const parsed = JSON.parse(savedRates) as { fetchedAt?: number; rates?: unknown }
        if (parsed.rates) setRates(mergeRates(parsed.rates))
        if (parsed.fetchedAt && Date.now() - parsed.fetchedAt < RATE_TTL) return
      } catch {
        localStorage.removeItem(RATES_KEY)
      }
    }

    const controller = new AbortController()
    fetch(RATE_URL, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Currency service returned ${response.status}`)
        return response.json() as Promise<{ rates?: unknown }>
      })
      .then(data => {
        const next = mergeRates(data.rates)
        setRates(next)
        localStorage.setItem(RATES_KEY, JSON.stringify({ fetchedAt: Date.now(), rates: next }))
      })
      .catch(() => {
        // Cached or bundled fallback rates keep pricing usable when the
        // public exchange-rate service is temporarily unavailable.
      })

    return () => controller.abort()
  }, [])

  const setCurrency = useCallback((next: CurrencyCode) => {
    setCurrencyState(next)
    localStorage.setItem(CURRENCY_KEY, next)
  }, [])

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    rates,
    setCurrency,
    money: (amount) => formatMoney(amount, currency, rates),
  }), [currency, rates, setCurrency])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error('useCurrency must be used inside CurrencyProvider')
  return context
}
