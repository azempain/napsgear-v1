import { describe, it, expect } from 'vitest'
import { validateCheckout, buildOrderPayload, type CheckoutForm } from './checkout'
import type { CartItem } from '@/context/CartContext'

const valid: CheckoutForm = {
  fullName: 'Jane Doe', email: 'jane@example.com', phone: '555 123 4567',
  address1: '12 King St', address2: '', city: 'Austin',
  state: 'TX', postalCode: '78701', country: 'United States', notes: '',
}
const items: CartItem[] = [
  { id: 'a__1', name: 'Altamofen — 1 pack', price: 30, qty: 2 },
  { id: 'b__5', name: 'Anazole — 5 packs', price: 143, qty: 1 },
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

describe('buildOrderPayload', () => {
  const p = buildOrderPayload(valid, items)
  it('subject + from_name + replyto', () => {
    expect(p.subject).toBe('New NapsGear order — Jane Doe')
    expect(p.from_name).toBe('NapsGear Checkout')
    expect(p.replyto).toBe('jane@example.com')
  })
  it('serializes order_items as qty× name  $lineTotal', () => {
    expect(p.order_items).toBe(
      '2× Altamofen — 1 pack  $60.00\n1× Anazole — 5 packs  $143.00')
  })
  it('totals match cart.ts (subtotal 203, shipping 35, loyalty 40, total 238)', () => {
    expect(p.order_subtotal).toBe('$203.00')
    expect(p.order_shipping).toBe('$35.00')
    expect(p.order_loyalty_credit).toBe('$40.00')
    expect(p.order_total).toBe('$238.00')
  })
  it('does NOT contain access_key', () => {
    expect('access_key' in p).toBe(false)
  })
  it('notes fallback when empty', () => {
    expect(buildOrderPayload(valid, items).order_notes).toBe('(none)')
  })
})
