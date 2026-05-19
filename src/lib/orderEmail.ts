// Composes the human-facing body of the order-notification email.
//
// Why plain text? Web3Forms' API has no field for a custom HTML body — the
// surrounding email template lives in their dashboard. A well-formatted
// monospace plain-text body, however, renders identically across Gmail,
// Outlook, Apple Mail, mobile clients, and plain-text-only inboxes. Sectioned
// dividers + right-aligned dollar columns make the order scannable at a
// glance with no rendering quirks to debug.

import type { CartItem } from '@/context/CartContext'
import { subtotal, shippingFee, loyaltyCredit, total, formatCartLine } from './cart'
import type { CheckoutForm } from './checkout'

const WIDTH = 63
const DIVIDER = '─'.repeat(WIDTH)
const DOUBLE = '═'.repeat(WIDTH)
const SUBLINE = '─'.repeat(WIDTH - 8)

const fmt = (n: number) => `$${n.toFixed(2)}`

/** Pad a left/right pair onto a single line with dot-leaders so eyes track
 *  the value column. Falls back to a wide space gap if the line is too long
 *  for any dots to fit. */
function dottedLine(left: string, right: string): string {
  const inner = WIDTH - 2 - left.length - right.length
  if (inner < 4) {
    // Long line — drop to a single space; better than wrapping mid-cell.
    return `  ${left} ${right}`
  }
  return `  ${left} ${'.'.repeat(inner - 2)} ${right}`
}

function indent(s: string, prefix = '  '): string {
  return s.split('\n').map(l => l ? prefix + l : l).join('\n')
}

function buildAddressBlock(f: CheckoutForm): string {
  return [
    f.address1,
    f.address2,
    `${f.city}, ${f.state} ${f.postalCode}`,
    f.country,
  ].filter(s => s && s.trim()).join('\n')
}

function buildItemsBlock(items: CartItem[]): string {
  if (items.length === 0) return '  (no items)'
  return items.map(i => {
    const left  = `${i.qty} × ${formatCartLine(i)}`
    const right = fmt(i.price * i.qty)
    return dottedLine(left, right)
  }).join('\n')
}

function buildTotalsBlock(items: CartItem[]): string {
  const lines = [
    dottedLine('Subtotal:',              fmt(subtotal(items))),
    dottedLine('Shipping & Handling:',   fmt(shippingFee(items))),
    dottedLine('Loyalty Credit Earned:', fmt(loyaltyCredit(items))),
    '  ' + SUBLINE,
    dottedLine('TOTAL:',                 fmt(total(items))),
  ]
  return lines.join('\n')
}

export interface RenderOrderEmailOpts {
  /** Injected for tests; defaults to new Date() at call time. */
  now?: Date
}

export function renderOrderEmail(
  f: CheckoutForm,
  items: CartItem[],
  opts: RenderOrderEmailOpts = {},
): string {
  const now = opts.now ?? new Date()
  const submitted = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
  const itemCount = items.reduce((s, i) => s + i.qty, 0)
  const notes = f.notes.trim() || '(none)'

  return [
    DOUBLE,
    centered('NEW NAPSGEAR ORDER'),
    DOUBLE,
    '',
    `  Submitted: ${submitted}`,
    '',
    dottedLine('Customer:', f.fullName),
    dottedLine('Email:',    f.email),
    dottedLine('Phone:',    f.phone),
    dottedLine('Items:',    String(itemCount)),
    dottedLine('Total:',    fmt(total(items))),
    '',
    DIVIDER,
    '  SHIPPING ADDRESS',
    DIVIDER,
    '',
    indent(buildAddressBlock(f)),
    '',
    DIVIDER,
    '  ITEMS',
    DIVIDER,
    '',
    buildItemsBlock(items),
    '',
    DIVIDER,
    '  TOTALS',
    DIVIDER,
    '',
    buildTotalsBlock(items),
    '',
    DIVIDER,
    '  ORDER NOTES',
    DIVIDER,
    '',
    indent(notes),
    '',
    DOUBLE,
  ].join('\n')
}

function centered(s: string): string {
  const pad = Math.max(0, Math.floor((WIDTH - s.length) / 2))
  return ' '.repeat(pad) + s
}

/** Short, scannable subject for inbox triage. */
export function buildOrderSubject(f: CheckoutForm, items: CartItem[]): string {
  const count = items.reduce((s, i) => s + i.qty, 0)
  const unit = count === 1 ? 'item' : 'items'
  return `New NapsGear order — ${f.fullName} — ${count} ${unit} — ${fmt(total(items))}`
}
