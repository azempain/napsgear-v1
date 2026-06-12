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
    <div className="header-dropdown header-currency">
      <button
        type="button"
        className="ngc-currency-trigger"
        id="dropdownCurrency"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        {currency}
      </button>
      <div className="dropdown-menu dropdown-menu-arrow-centered min-width-0" aria-labelledby="dropdownCurrency">
        {SUPPORTED_CURRENCIES.map(code => (
          <button
            key={code}
            type="button"
            className={`dropdown-item${currency === code ? ' active' : ''}`}
            onClick={() => setCurrency(code)}
          >
            {NAMES[code]} ({code})
          </button>
        ))}
      </div>
    </div>
  )
}
