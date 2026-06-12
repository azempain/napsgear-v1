'use client'

import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/currency'
import { useCurrency } from '@/context/CurrencyContext'

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
            {code}
          </option>
        ))}
      </select>
    </label>
  )
}
