import { describe, it, expect } from 'vitest'
import {
  renderCustomer, renderShipping, renderItems, renderTotals, renderPaymentInstructions, buildOrderSubject,
} from './orderEmail'
import type { CheckoutForm } from './checkout'
import type { CartItem } from '@/context/CartContext'

const FORM: CheckoutForm = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555 123 4567',
  address1: '12 King St',
  address2: 'Apt 3',
  city: 'Austin',
  state: 'TX',
  postalCode: '78701',
  country: 'United States',
  notes: 'Please leave at the door.',
}

const ITEMS: CartItem[] = [
  { id: 'a__1', productName: 'Altamofen', packCount: 1, slug: 'a', price: 30, qty: 2 },
  { id: 'b__5', productName: 'Anazole',   packCount: 5, slug: 'b', price: 143, qty: 1 },
]

describe('renderCustomer', () => {
  it('packs name, email, phone onto separate lines', () => {
    expect(renderCustomer(FORM)).toBe('Jane Doe\njane@example.com\n555 123 4567')
  })
  it('drops blank fields rather than emitting empty lines', () => {
    const out = renderCustomer({ ...FORM, phone: '' })
    expect(out).toBe('Jane Doe\njane@example.com')
    expect(out).not.toMatch(/\n\n/)
  })
})

describe('renderShipping', () => {
  it('renders four-line address block when address2 present', () => {
    expect(renderShipping(FORM)).toBe(
      '12 King St\nApt 3\nAustin, TX 78701\nUnited States',
    )
  })
  it('skips blank address2 cleanly', () => {
    expect(renderShipping({ ...FORM, address2: '' })).toBe(
      '12 King St\nAustin, TX 78701\nUnited States',
    )
  })
})

describe('renderItems', () => {
  it('one line per item, qty × name · $lineTotal', () => {
    expect(renderItems(ITEMS)).toBe(
      '2 × Altamofen — 1 pack · $60.00\n1 × Anazole — 5 packs · $143.00',
    )
  })
  it('shows "(no items)" rather than an empty string for empty carts', () => {
    expect(renderItems([])).toBe('(no items)')
  })
  it('contains no ASCII box-drawing characters', () => {
    expect(renderItems(ITEMS)).not.toMatch(/[═─]/)
  })
})

describe('renderTotals', () => {
  it('Subtotal / Shipping / Loyalty credit / TOTAL on four lines', () => {
    expect(renderTotals(ITEMS)).toBe(
      'Subtotal · $203.00\nShipping · $35.00\nLoyalty credit · $40.00\nTOTAL · $238.00',
    )
  })
  it('uppercased TOTAL line stands out without a divider above it', () => {
    expect(renderTotals(ITEMS)).toMatch(/\nTOTAL · /)
  })
})

describe('renderPaymentInstructions', () => {
  it('includes the order reference and Bitcoin payment method', () => {
    const out = renderPaymentInstructions(ITEMS, 'NG-20260623-ABC123')
    expect(out).toContain('Payment method: Bitcoin')
    expect(out).toContain('Order reference: NG-20260623-ABC123')
    expect(out).toContain('Order total: $238.00')
  })
})

describe('buildOrderSubject', () => {
  it('includes name, item count, and total', () => {
    expect(buildOrderSubject(FORM, ITEMS)).toBe(
      'New NapsGear order — Jane Doe — 3 items — $238.00',
    )
  })
  it('singular vs plural item word', () => {
    const oneItem: CartItem[] = [{ ...ITEMS[0], qty: 1 }]
    expect(buildOrderSubject(FORM, oneItem)).toContain('1 item — $')
    expect(buildOrderSubject(FORM, oneItem)).not.toContain('1 items')
  })
})
