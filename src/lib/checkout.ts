import type { CartItem } from '@/context/CartContext'
import { total } from './cart'
import {
  renderCustomer, renderShipping, renderItems, renderTotals, buildOrderSubject,
} from './orderEmail'

export interface CheckoutForm {
  fullName: string
  email: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  notes: string
}

/**
 * Tight, Anthropic-invoice-style payload. Web3Forms renders each JSON key as
 * its own labeled block in the inbox, so we lean on its native field
 * rendering instead of stacking our own dividers on top. Order of keys here
 * is the order the inbox shows them.
 */
export interface OrderPayload {
  subject: string
  from_name: string
  replyto: string
  /** Multi-line: name / email / phone */
  customer: string
  /** Multi-line: address block, blanks dropped */
  shipping: string
  /** One line per item: "N × Name · $line_total" */
  items: string
  /** Subtotal / Shipping / Loyalty / TOTAL on separate lines */
  totals: string
  /** Omitted from the payload entirely when the user didn't type anything */
  notes?: string
  /** Single-line scalar so the Web3Forms dashboard can sort/filter by it */
  order_total: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Per-field validators. Each returns `undefined` when valid, or a user-facing
 *  error string. Used at field-level by TanStack Form (onBlur) and aggregated
 *  by validateCheckout() at submit time. */
export const checkoutFieldValidators: {
  [K in keyof CheckoutForm]: (value: string) => string | undefined
} = {
  fullName: (v) => v.trim() ? undefined : 'Full name is required',
  email: (v) => {
    const t = v.trim()
    if (!t) return 'Email is required'
    if (!EMAIL_RE.test(t)) return 'Enter a valid email address'
    return undefined
  },
  phone: (v) => {
    const t = v.trim()
    if (!t) return 'Phone is required'
    if (t.replace(/\D/g, '').length < 7) return 'Enter a valid phone number'
    return undefined
  },
  address1:   (v) => v.trim() ? undefined : 'Address is required',
  address2:   () => undefined,
  city:       (v) => v.trim() ? undefined : 'City is required',
  state:      (v) => v.trim() ? undefined : 'State/Region is required',
  postalCode: (v) => v.trim() ? undefined : 'Postal code is required',
  country:    (v) => v.trim() ? undefined : 'Country is required',
  notes:      () => undefined,
}

export function validateCheckout(f: CheckoutForm): Record<string, string> {
  const e: Record<string, string> = {}
  ;(Object.keys(checkoutFieldValidators) as (keyof CheckoutForm)[]).forEach(k => {
    const msg = checkoutFieldValidators[k](f[k])
    if (msg) e[k] = msg
  })
  return e
}

const fmt = (n: number) => `$${n.toFixed(2)}`

export function buildOrderPayload(f: CheckoutForm, items: CartItem[]): OrderPayload {
  const payload: OrderPayload = {
    subject: buildOrderSubject(f, items),
    from_name: 'NapsGear Checkout',
    replyto: f.email,
    customer: renderCustomer(f),
    shipping: renderShipping(f),
    items: renderItems(items),
    totals: renderTotals(items),
    order_total: fmt(total(items)),
  }
  const trimmed = f.notes.trim()
  if (trimmed) payload.notes = trimmed
  return payload
}
