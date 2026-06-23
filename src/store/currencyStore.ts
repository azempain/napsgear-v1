'use client'

import { Store } from '@tanstack/store'
import { useStore } from '@tanstack/react-store'
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
  hydrated: boolean
}

type CurrencyActions = {
  setCurrency: (currency: CurrencyCode) => void
  setRates: (rates: CurrencyRates, fetchedAt: number) => void
  hydrate: (state: Partial<Pick<CurrencyState, 'currency' | 'rates' | 'fetchedAt'>>) => void
  setHydrated: (hydrated: boolean) => void
}

export type CurrencyView = CurrencyState & CurrencyActions & {
  money: (usdAmount: number) => string
}

export const CURRENCY_STORAGE_KEY = 'napsgear_currency'

const initialState: CurrencyState = {
  currency: 'USD',
  rates: FALLBACK_RATES,
  fetchedAt: 0,
  hydrated: false,
}

export const currencyStore = new Store(initialState, (store): CurrencyActions => ({
  setCurrency(currency) {
    store.setState(state => ({ ...state, currency }))
  },
  setRates(rates, fetchedAt) {
    store.setState(state => ({ ...state, rates, fetchedAt }))
  },
  hydrate(snapshot) {
    store.setState(state => ({
      ...state,
      ...snapshot,
      rates: snapshot.rates ?? state.rates,
      hydrated: true,
    }))
  },
  setHydrated(hydrated) {
    store.setState(state => ({ ...state, hydrated }))
  },
}))

export function currencyMoney(usdAmount: number) {
  const { currency, rates, hydrated } = currencyStore.state
  return formatMoney(usdAmount, hydrated ? currency : 'USD', hydrated ? rates : FALLBACK_RATES)
}

function currencyView(state: CurrencyState): CurrencyView {
  return {
    ...state,
    ...currencyStore.actions,
    money: currencyMoney,
  }
}

export function useCurrencyStore<T = CurrencyView>(selector?: (state: CurrencyView) => T): T {
  const state = useStore(currencyStore)
  const view = currencyView(state)
  return selector ? selector(view) : (view as T)
}
