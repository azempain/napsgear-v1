import { describe, it, expect } from 'vitest'
import { validateCheckout, buildOrderPayload, checkoutFieldValidators, type CheckoutForm } from './checkout'
import type { CartItem } from '@/context/CartContext'

const valid: CheckoutForm = {
  fullName: 'Jane Doe', email: 'jane@example.com', phone: '555 123 4567',
  address1: '12 King St', address2: '', city: 'Austin',
  state: 'TX', postalCode: '78701', country: 'United States', notes: '',
}
const items: CartItem[] = [
  { id: 'a__1', productName: 'Altamofen', packCount: 1, slug: 'a', price: 30, qty: 2 },
  { id: 'b__5', productName: 'Anazole', packCount: 5, slug: 'b', price: 143, qty: 1 },
]

describe('validateCheckout', () => {
  it('valid form -> no errors', () => {
    expect(validateCheckout(valid)).toEqual({})
  })
  it('flags every required field when blank', () => {
    const e = validateCheckout({ ...valid, fullName:'', email:'', phone:'',
      address1:'', city:'', state:'', postalCode:'', country:'' })
    expect(Object.keys(e).sort()).toEqual(
      ['address1','city','country','email','fullName','phone','postalCode','state'].sort())
  })
  it('rejects malformed email', () => {
    expect(validateCheckout({ ...valid, email: 'not-an-email' }).email).toBeTruthy()
    expect(validateCheckout({ ...valid, email: 'a@b' }).email).toBeTruthy()
  })
  it('rejects phone with < 7 digits', () => {
    expect(validateCheckout({ ...valid, phone: '12345' }).phone).toBeTruthy()
  })
  it('address2 and notes are optional', () => {
    expect(validateCheckout({ ...valid, address2: '', notes: '' })).toEqual({})
  })
})

describe('checkoutFieldValidators (per-field)', () => {
  it('fullName: required', () => {
    expect(checkoutFieldValidators.fullName('')).toBe('Full name is required')
    expect(checkoutFieldValidators.fullName('  ')).toBe('Full name is required')
    expect(checkoutFieldValidators.fullName('Jane')).toBeUndefined()
  })
  it('email: required + format', () => {
    expect(checkoutFieldValidators.email('')).toBe('Email is required')
    expect(checkoutFieldValidators.email('not-an-email')).toBe('Enter a valid email address')
    expect(checkoutFieldValidators.email('a@b')).toBe('Enter a valid email address')
    expect(checkoutFieldValidators.email('jane@example.com')).toBeUndefined()
  })
  it('phone: required + at least 7 digits', () => {
    expect(checkoutFieldValidators.phone('')).toBe('Phone is required')
    expect(checkoutFieldValidators.phone('12345')).toBe('Enter a valid phone number')
    expect(checkoutFieldValidators.phone('555-123-4567')).toBeUndefined()
  })
  it('address2 + notes are optional (always undefined)', () => {
    expect(checkoutFieldValidators.address2('')).toBeUndefined()
    expect(checkoutFieldValidators.notes('')).toBeUndefined()
  })
  it('plain required fields', () => {
    for (const k of ['address1', 'city', 'state', 'postalCode', 'country'] as const) {
      expect(checkoutFieldValidators[k]('')).toBeTruthy()
      expect(checkoutFieldValidators[k]('value')).toBeUndefined()
    }
  })
})

describe('buildOrderPayload', () => {
  const FROZEN = new Date('2026-05-19T04:23:00Z')
  const p = buildOrderPayload(valid, items, { now: FROZEN })

  it('subject is the scannable triage format (name — N items — total)', () => {
    expect(p.subject).toBe('New NapsGear order — Jane Doe — 3 items — $238.00')
  })
  it('from_name + replyto + customer fields', () => {
    expect(p.from_name).toBe('NapsGear Checkout')
    expect(p.replyto).toBe('jane@example.com')
    expect(p.customer_name).toBe('Jane Doe')
    expect(p.customer_email).toBe('jane@example.com')
    expect(p.customer_phone).toBe('555 123 4567')
  })
  it('shipping_address joins lines with \\n and skips blanks', () => {
    expect(p.shipping_address).toBe('12 King St\nAustin, TX 78701\nUnited States')
  })
  it('order_total kept as a top-level sortable field', () => {
    expect(p.order_total).toBe('$238.00')
  })
  it('message contains the rich body — sections, customer, totals, notes', () => {
    expect(p.message).toMatch(/NEW NAPSGEAR ORDER/)
    expect(p.message).toMatch(/Customer:.*Jane Doe/)
    expect(p.message).toMatch(/TOTAL:.*\$238\.00/)
    expect(p.message).toMatch(/ORDER NOTES/)
  })
  it('does NOT contain access_key', () => {
    expect('access_key' in p).toBe(false)
  })
  it('does NOT contain the legacy fragmentary order_* fields', () => {
    // These were merged into `message` to avoid duplicating data in the inbox.
    for (const k of ['order_items', 'order_subtotal', 'order_shipping', 'order_loyalty_credit', 'order_notes']) {
      expect(k in p).toBe(false)
    }
  })
})
