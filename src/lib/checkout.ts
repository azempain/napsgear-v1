import type { CartItem } from '@/context/CartContext'
import { total } from './cart'
import {
  renderCustomer, renderShipping, renderItems, renderTotals, renderPaymentInstructions, buildOrderSubject,
} from './orderEmail'
import { z } from 'zod'

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  phone: z.string().trim()
    .min(1, 'Phone is required')
    .refine(value => value.replace(/\D/g, '').length >= 7, 'Enter a valid phone number'),
  address1: z.string().trim().min(1, 'Address is required'),
  address2: z.string().trim(),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State/Region is required'),
  postalCode: z.string().trim().min(1, 'Postal code is required'),
  country: z.string().trim().min(1, 'Country is required'),
  notes: z.string().trim().max(2000, 'Order notes must be 2,000 characters or fewer'),
})

export type CheckoutForm = z.infer<typeof checkoutSchema>

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
  /** Web3Forms honeypot — must be empty for legitimate submissions. Bots
   *  that auto-fill every form field will populate this, and Web3Forms
   *  server-side rejects any submission where botcheck is non-empty.
   *  See https://docs.web3forms.com/getting-started/spam-protection */
  botcheck: string
  /** Multi-line: name / email / phone */
  customer: string
  /** Multi-line: address block, blanks dropped */
  shipping: string
  /** One line per item: "N × Name · $line_total" */
  items: string
  /** Subtotal / Shipping / Loyalty / TOTAL on separate lines */
  totals: string
  /** Bitcoin wallet/payment-link instructions for manual payment matching */
  payment: string
  /** Omitted from the payload entirely when the user didn't type anything */
  notes?: string
  /** Single-line scalar so the Web3Forms dashboard can sort/filter by it */
  order_total: string
}

/** Per-field validators. Each returns `undefined` when valid, or a user-facing
 *  error string. Used at field-level by TanStack Form (onBlur) and aggregated
 *  by validateCheckout() at submit time. */
export const checkoutFieldValidators: {
  [K in keyof CheckoutForm]: (value: string) => string | undefined
} = {
  fullName: value => fieldError('fullName', value),
  email: value => fieldError('email', value),
  phone: value => fieldError('phone', value),
  address1: value => fieldError('address1', value),
  address2: value => fieldError('address2', value),
  city: value => fieldError('city', value),
  state: value => fieldError('state', value),
  postalCode: value => fieldError('postalCode', value),
  country: value => fieldError('country', value),
  notes: value => fieldError('notes', value),
}

export function validateCheckout(f: CheckoutForm): Record<string, string> {
  const result = checkoutSchema.safeParse(f)
  if (result.success) return {}
  return result.error.issues.reduce<Record<string, string>>((errors, issue) => {
    const key = issue.path[0]
    if (typeof key === 'string' && !errors[key]) errors[key] = issue.message
    return errors
  }, {})
}

function fieldError<K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]) {
  const result = checkoutSchema.shape[field].safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}

const fmt = (n: number) => `$${n.toFixed(2)}`

export function buildOrderPayload(f: CheckoutForm, items: CartItem[], reference = ''): OrderPayload {
  const validForm = checkoutSchema.parse(f)
  const payload: OrderPayload = {
    subject: buildOrderSubject(validForm, items),
    from_name: 'NapsGear Checkout',
    replyto: validForm.email,
    botcheck: '',
    customer: renderCustomer(validForm),
    shipping: renderShipping(validForm),
    items: renderItems(items),
    totals: renderTotals(items),
    payment: renderPaymentInstructions(items, reference),
    order_total: fmt(total(items)),
  }
  const trimmed = validForm.notes
  if (trimmed) payload.notes = trimmed
  return payload
}
