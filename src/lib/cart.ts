export interface LineItem {
  price: number
  qty: number
}

export const SHIPPING_FEE = 35
export const LOYALTY_RATE = 0.2

export function subtotal(items: LineItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0)
}

export function shippingFee(items: LineItem[]): number {
  return items.length > 0 ? SHIPPING_FEE : 0
}

export function loyaltyCredit(items: LineItem[]): number {
  return Math.floor(subtotal(items) * LOYALTY_RATE)
}

export function total(items: LineItem[]): number {
  return subtotal(items) + shippingFee(items)
}
