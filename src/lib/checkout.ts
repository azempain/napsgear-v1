import type { CartItem } from '@/context/CartContext'
import { total } from './cart'
import { renderOrderEmail, buildOrderSubject } from './orderEmail'

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
  /** The full pretty-printed order body. This is what makes the inbox view
   *  readable — see renderOrderEmail. */
  message: string
  /** Kept as a top-level field so the Web3Forms dashboard can sort by it. */
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

/** Build the Web3Forms payload. The richly formatted email body lives in
 *  `message`; the redundant order_items / order_subtotal / etc. fields were
 *  removed because Web3Forms renders ALL JSON keys into the email — having
 *  the same data twice made the inbox noisy. `order_total` is kept so the
 *  Web3Forms dashboard can sort/filter by it. */
export interface BuildOrderPayloadOpts {
  /** Injected for tests — drives the "Submitted" timestamp in the body. */
  now?: Date
}

export function buildOrderPayload(
  f: CheckoutForm,
  items: CartItem[],
  opts: BuildOrderPayloadOpts = {},
): OrderPayload {
  const address = [
    f.address1,
    f.address2,
    `${f.city}, ${f.state} ${f.postalCode}`,
    f.country,
  ].filter(s => s && s.trim()).join('\n')

  return {
    subject: buildOrderSubject(f, items),
    from_name: 'NapsGear Checkout',
    replyto: f.email,
    customer_name: f.fullName,
    customer_email: f.email,
    customer_phone: f.phone,
    shipping_address: address,
    message: renderOrderEmail(f, items, { now: opts.now }),
    order_total: fmt(total(items)),
  }
}
