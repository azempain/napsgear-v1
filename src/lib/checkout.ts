import type { CartItem } from '@/context/CartContext'
import { subtotal, shippingFee, loyaltyCredit, total, formatCartLine } from './cart'

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

export interface OrderPayload {
  subject: string
  from_name: string
  replyto: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  order_notes: string
  order_items: string
  order_subtotal: string
  order_shipping: string
  order_loyalty_credit: string
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
  const address = [
    f.address1,
    f.address2,
    `${f.city}, ${f.state} ${f.postalCode}`,
    f.country,
  ].filter(s => s && s.trim()).join('\n')

  return {
    subject: `New NapsGear order — ${f.fullName}`,
    from_name: 'NapsGear Checkout',
    replyto: f.email,
    customer_name: f.fullName,
    customer_email: f.email,
    customer_phone: f.phone,
    shipping_address: address,
    order_notes: f.notes.trim() || '(none)',
    order_items: items
      .map(i => `${i.qty}× ${formatCartLine(i)}  ${fmt(i.price * i.qty)}`)
      .join('\n'),
    order_subtotal: fmt(subtotal(items)),
    order_shipping: fmt(shippingFee(items)),
    order_loyalty_credit: fmt(loyaltyCredit(items)),
    order_total: fmt(total(items)),
  }
}
