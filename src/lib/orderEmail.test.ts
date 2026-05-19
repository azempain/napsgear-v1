import { describe, it, expect } from 'vitest'
import { renderOrderEmail, buildOrderSubject } from './orderEmail'
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

// Frozen now for deterministic snapshot of the submitted-at stamp
const FROZEN_NOW = new Date('2026-05-19T04:23:00.000Z')

describe('renderOrderEmail', () => {
  const body = renderOrderEmail(FORM, ITEMS, { now: FROZEN_NOW })

  it('contains all section headers', () => {
    expect(body).toMatch(/NEW NAPSGEAR ORDER/)
    expect(body).toMatch(/SHIPPING ADDRESS/)
    expect(body).toMatch(/ITEMS/)
    expect(body).toMatch(/TOTALS/)
    expect(body).toMatch(/ORDER NOTES/)
  })

  it('contains the submitted-at stamp in UTC', () => {
    expect(body).toMatch(/Submitted:\s+2026-05-19 04:23 UTC/)
  })

  it('shows the customer block (name, email, phone)', () => {
    expect(body).toMatch(/Customer:\s+\.+\s+Jane Doe/) // dot-leader pattern
    expect(body).toContain('jane@example.com')
    expect(body).toContain('555 123 4567')
  })

  it('renders the shipping address block including address2', () => {
    expect(body).toContain('12 King St')
    expect(body).toContain('Apt 3')
    expect(body).toContain('Austin, TX 78701')
    expect(body).toContain('United States')
  })

  it('skips blank address lines (no double newline gap)', () => {
    const noApt = renderOrderEmail({ ...FORM, address2: '' }, ITEMS, { now: FROZEN_NOW })
    expect(noApt).not.toMatch(/\n\n12 King St\n\n/)
    expect(noApt).toContain('12 King St\n  Austin, TX 78701')
  })

  it('renders items with qty × name and right-aligned line totals', () => {
    expect(body).toMatch(/2 × Altamofen — 1 pack/)
    expect(body).toMatch(/1 × Anazole — 5 packs/)
    // dollar amounts should appear on the item lines
    expect(body).toMatch(/\$60\.00/)
    expect(body).toMatch(/\$143\.00/)
  })

  it('renders totals block with subtotal/shipping/loyalty/TOTAL', () => {
    expect(body).toMatch(/Subtotal:.*\$203\.00/)
    expect(body).toMatch(/Shipping & Handling:.*\$35\.00/)
    expect(body).toMatch(/Loyalty Credit Earned:.*\$40\.00/)
    expect(body).toMatch(/TOTAL:.*\$238\.00/)
  })

  it('renders notes as-is, or "(none)" when blank', () => {
    expect(body).toContain('Please leave at the door.')
    const blank = renderOrderEmail({ ...FORM, notes: '' }, ITEMS, { now: FROZEN_NOW })
    expect(blank).toMatch(/ORDER NOTES[\s\S]*\(none\)/)
  })

  it('uses box-drawing dividers (Unicode safe across mail clients)', () => {
    expect(body).toContain('═')
    expect(body).toContain('─')
  })

  it('handles an empty cart without throwing', () => {
    const empty = renderOrderEmail(FORM, [], { now: FROZEN_NOW })
    expect(empty).toContain('(no items)')
    expect(empty).toMatch(/TOTAL:.*\$0\.00/)
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
