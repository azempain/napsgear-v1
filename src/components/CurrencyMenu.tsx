'use client'

import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/currency'
import { useCurrency } from '@/context/CurrencyContext'

const NAMES: Record<CurrencyCode, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
}

export default function CurrencyMenu() {
  const { currency, setCurrency } = useCurrency()

  return (
    <label className="header-currency ngc-currency-field">
      <span className="sr-only">Display currency</span>
      <select
        id="dropdownCurrency"
        className="ngc-currency-select"
        value={currency}
        onChange={event => setCurrency(event.target.value as CurrencyCode)}
      >
        {SUPPORTED_CURRENCIES.map(code => (
          <option key={code} value={code}>
            {NAMES[code]} ({code})
          </option>
        ))}
      </select>
    </label>
  )
}
