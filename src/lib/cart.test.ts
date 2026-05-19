import { describe, it, expect } from 'vitest'
import { subtotal, shippingFee, loyaltyCredit, total, formatCartLine, type LineItem } from './cart'

const items: LineItem[] = [
  { price: 30, qty: 1 },
  { price: 10, qty: 2 },
]

describe('cart math', () => {
  it('subtotal sums price * qty', () => {
    expect(subtotal(items)).toBe(50)
  })
  it('subtotal of empty cart is 0', () => {
    expect(subtotal([])).toBe(0)
  })
  it('shipping fee is flat 35 when cart has items', () => {
    expect(shippingFee(items)).toBe(35)
  })
  it('shipping fee is 0 for empty cart', () => {
    expect(shippingFee([])).toBe(0)
  })
  it('loyalty credit is 20% of subtotal, floored', () => {
    expect(loyaltyCredit(items)).toBe(10) // 20% of 50
    expect(loyaltyCredit([{ price: 30, qty: 1 }])).toBe(6) // matches saved page
  })
  it('total is subtotal + shipping', () => {
    expect(total(items)).toBe(85) // 50 + 35
    expect(total([])).toBe(0)
  })
})

describe('formatCartLine', () => {
  it('singular pack, no label', () => {
    expect(formatCartLine({ productName: 'Altamofen', packCount: 1 }))
      .toBe('Altamofen — 1 pack')
  })
  it('plural packs, no label', () => {
    expect(formatCartLine({ productName: 'Anazole', packCount: 5 }))
      .toBe('Anazole — 5 packs')
  })
  it('includes packLabel in parens when present', () => {
    expect(formatCartLine({ productName: 'Altamofen', packCount: 1, packLabel: '50 tabs (20mg/tab)' }))
      .toBe('Altamofen — 1 pack (50 tabs (20mg/tab))')
  })
})
