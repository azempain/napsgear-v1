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
  const p = buildOrderPayload(valid, items)

  it('subject is the scannable triage format (name — N items — total)', () => {
    expect(p.subject).toBe('New NapsGear order — Jane Doe — 3 items — $238.00')
  })
  it('from_name + replyto', () => {
    expect(p.from_name).toBe('NapsGear Checkout')
    expect(p.replyto).toBe('jane@example.com')
  })
  it('customer field is tight 3-line name/email/phone block', () => {
    expect(p.customer).toBe('Jane Doe\njane@example.com\n555 123 4567')
  })
  it('shipping field joins lines with \\n and skips blanks', () => {
    expect(p.shipping).toBe('12 King St\nAustin, TX 78701\nUnited States')
  })
  it('items field is one line per item with · price', () => {
    expect(p.items).toBe('2 × Altamofen — 1 pack · $60.00\n1 × Anazole — 5 packs · $143.00')
  })
  it('totals field has Subtotal/Shipping/Loyalty/TOTAL on four lines', () => {
    expect(p.totals).toBe(
      'Subtotal · $203.00\nShipping · $35.00\nLoyalty credit · $40.00\nTOTAL · $238.00',
    )
  })
  it('order_total kept as a top-level sortable field', () => {
    expect(p.order_total).toBe('$238.00')
  })
  it('does NOT contain access_key', () => {
    expect('access_key' in p).toBe(false)
  })
  it('includes botcheck honeypot as an empty string (Web3Forms anti-spam)', () => {
    expect(p.botcheck).toBe('')
  })
  it('does NOT contain the legacy fragmentary order_* fields', () => {
    // The old per-fragment fields (order_items, order_subtotal, ...) AND the
    // mega `message` field have all been removed to keep the inbox tight.
    for (const k of [
      'order_items', 'order_subtotal', 'order_shipping', 'order_loyalty_credit',
      'order_notes', 'message',
      // separate name/email/phone/address fields — collapsed into customer/shipping
      'customer_name', 'customer_email', 'customer_phone', 'shipping_address',
    ]) {
      expect(k in p).toBe(false)
    }
  })
  it('omits the notes field entirely when the user left it blank', () => {
    const blank = buildOrderPayload({ ...valid, notes: '' }, items)
    expect('notes' in blank).toBe(false)
  })
  it('includes notes only when the user typed something', () => {
    const withNotes = buildOrderPayload({ ...valid, notes: '  Leave at door.  ' }, items)
    expect(withNotes.notes).toBe('Leave at door.')
  })
})
