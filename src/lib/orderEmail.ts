// Per-field composers for the Web3Forms order email.
//
// Web3Forms renders every JSON key as its own labeled block in the inbox,
// with its own divider and blue header. Earlier versions of this file shipped
// a single `message` field full of box-drawing dividers — which, stacked on
// top of Web3Forms' own per-field separators, produced a noisy multi-page
// receipt. We now lean entirely on Web3Forms' native field rendering and keep
// each value tight: one-line per fact, no ASCII art, no duplication.
//
// Target aesthetic: Anthropic invoice tight.

import type { CartItem } from '@/context/CartContext'
import { subtotal, shippingFee, loyaltyCredit, total, formatCartLine } from './cart'
import type { CheckoutForm } from './checkout'

const fmt = (n: number) => `$${n.toFixed(2)}`

/** "Flux\njane@example.com\n8002428478" — one tight block instead of three
 *  separate Customer name / Customer email / Customer phone fields. */
export function renderCustomer(f: CheckoutForm): string {
  return [f.fullName, f.email, f.phone].filter(s => s && s.trim()).join('\n')
}

/** Multi-line address; blanks dropped. */
export function renderShipping(f: CheckoutForm): string {
  return [
    f.address1,
    f.address2,
    `${f.city}, ${f.state} ${f.postalCode}`,
    f.country,
  ].filter(s => s && s.trim()).join('\n')
}

/** One line per item: "2 × Altamofen — 1 pack · $60.00". Long product names
 *  wrap naturally in the inbox; the price is at the end so it stays findable. */
export function renderItems(items: CartItem[]): string {
  if (items.length === 0) return '(no items)'
  return items
    .map(i => `${i.qty} × ${formatCartLine(i)} · ${fmt(i.price * i.qty)}`)
    .join('\n')
}

/** Subtotal / Shipping / Loyalty / TOTAL — middle-dot separator, no
 *  decorative rule. The final TOTAL line is uppercased so it pops without
 *  needing a divider above it. */
export function renderTotals(items: CartItem[]): string {
  return [
    `Subtotal · ${fmt(subtotal(items))}`,
    `Shipping · ${fmt(shippingFee(items))}`,
    `Loyalty credit · ${fmt(loyaltyCredit(items))}`,
    `TOTAL · ${fmt(total(items))}`,
  ].join('\n')
}

/** Short, scannable subject for inbox triage. */
export function buildOrderSubject(f: CheckoutForm, items: CartItem[]): string {
  const count = items.reduce((s, i) => s + i.qty, 0)
  const unit = count === 1 ? 'item' : 'items'
  return `New NapsGear order — ${f.fullName} — ${count} ${unit} — ${fmt(total(items))}`
}
