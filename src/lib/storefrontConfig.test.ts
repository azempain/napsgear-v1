import { describe, expect, it } from 'vitest'
import { buildPaymentHref, buildWhatsAppHref, normalizeWhatsAppNumber, renderBitcoinInstructions } from './storefrontConfig'

describe('storefrontConfig helpers', () => {
  it('normalizes WhatsApp numbers for wa.me links', () => {
    expect(normalizeWhatsAppNumber('+1 (555) 123-4567')).toBe('15551234567')
    expect(buildWhatsAppHref('+1 (555) 123-4567')).toBe('https://wa.me/15551234567')
  })

  it('fills payment URL placeholders', () => {
    expect(buildPaymentHref({
      reference: 'NG-20260623-ABC123',
      total: '$238.00',
      baseUrl: 'https://pay.example/checkout?ref={reference}&amount={total}',
    })).toBe('https://pay.example/checkout?ref=NG-20260623-ABC123&amount=%24238.00')
  })

  it('renders Bitcoin payment instructions with configured support channels', () => {
    expect(renderBitcoinInstructions({
      reference: 'NG-20260623-ABC123',
      total: '$238.00',
      wallet: 'bc1-wallet',
      paymentUrl: 'https://pay.example/{reference}',
      supportEmail: 'support@example.com',
      supportWhatsApp: '+15551234567',
    })).toContain('BTC wallet: bc1-wallet')
  })
})
