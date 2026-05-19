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

export function validateCheckout(f: CheckoutForm): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.fullName.trim()) e.fullName = 'Full name is required'
  if (!f.email.trim()) e.email = 'Email is required'
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address'
  if (!f.phone.trim()) e.phone = 'Phone is required'
  else if (f.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number'
  if (!f.address1.trim()) e.address1 = 'Address is required'
  if (!f.city.trim()) e.city = 'City is required'
  if (!f.state.trim()) e.state = 'State/Region is required'
  if (!f.postalCode.trim()) e.postalCode = 'Postal code is required'
  if (!f.country.trim()) e.country = 'Country is required'
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
