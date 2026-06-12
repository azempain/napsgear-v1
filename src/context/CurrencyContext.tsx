'use client'

import { useEffect } from 'react'
import { mergeRates } from '@/lib/currency'
import { useCurrencyStore } from '@/store/currencyStore'

const RATE_TTL = 12 * 60 * 60 * 1000
const RATE_URL = 'https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR,GBP,CAD,AUD'

export default function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const fetchedAt = useCurrencyStore(state => state.fetchedAt)
  const setRates = useCurrencyStore(state => state.setRates)

  useEffect(() => {
    if (fetchedAt && Date.now() - fetchedAt < RATE_TTL) return

    const controller = new AbortController()
    fetch(RATE_URL, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Currency service returned ${response.status}`)
        return response.json() as Promise<Array<{ quote?: unknown; rate?: unknown }>>
      })
      .then(data => {
        const rates = Object.fromEntries(data.map(entry => [entry.quote, entry.rate]))
        setRates(mergeRates(rates), Date.now())
      })
      .catch(() => {
        // Cached or bundled fallback rates keep pricing usable when the
        // public exchange-rate service is temporarily unavailable.
      })

    return () => controller.abort()
  }, [fetchedAt, setRates])

  return children
}

export function useCurrency() {
  return useCurrencyStore()
}
