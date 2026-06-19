import { describe, expect, it, vi } from 'vitest'
import type { CartItem } from '@/context/CartContext'
import type { CheckoutForm } from './checkout'
import { createOrderReference, submitOrder } from './orderSubmission'

const form: CheckoutForm = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-123-4567',
  address1: '12 King St',
  address2: '',
  city: 'Austin',
  state: 'TX',
  postalCode: '78701',
  country: 'United States',
  notes: '',
}

const items: CartItem[] = [
  { id: 'item__1', productName: 'Example', packCount: 1, slug: 'item', price: 40, qty: 1 },
]

describe('createOrderReference', () => {
  it('creates a readable date-prefixed reference', () => {
    expect(createOrderReference(new Date('2026-06-12T08:00:00Z'), 0)).toBe('NG-20260612-000000')
  })
})

describe('submitOrder', () => {
  it('submits a validated payload and returns its reference', async () => {
    const requests: RequestInit[] = []
    const fetchImpl: typeof fetch = async (_input, init) => {
      requests.push(init ?? {})
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    const result = await submitOrder({ accessKey: 'key', form, items, fetchImpl })

    expect(result.reference).toMatch(/^NG-\d{8}-[A-Z0-9]{6}$/)
    expect(requests).toHaveLength(1)
    const body = JSON.parse(String(requests[0]?.body))
    expect(body.order_reference).toBe(result.reference)
    expect(body.access_key).toBe('key')
  })

  it('includes the hCaptcha token as h-captcha-response when provided', async () => {
    const requests: RequestInit[] = []
    const fetchImpl: typeof fetch = async (_input, init) => {
      requests.push(init ?? {})
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    await submitOrder({ accessKey: 'key', form, items, fetchImpl, captchaToken: 'tok-123' })

    const body = JSON.parse(String(requests[0]?.body))
    expect(body['h-captcha-response']).toBe('tok-123')
  })

  it('omits h-captcha-response when no token is supplied', async () => {
    const requests: RequestInit[] = []
    const fetchImpl: typeof fetch = async (_input, init) => {
      requests.push(init ?? {})
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    await submitOrder({ accessKey: 'key', form, items, fetchImpl })

    const body = JSON.parse(String(requests[0]?.body))
    expect('h-captcha-response' in body).toBe(false)
  })

  it('rejects empty carts before making a request', async () => {
    const fetchImpl = vi.fn()
    await expect(submitOrder({ accessKey: 'key', form, items: [], fetchImpl })).rejects.toThrow('cart is empty')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('surfaces provider errors', async () => {
    const fetchImpl = vi.fn(async () => new Response(
      JSON.stringify({ success: false, message: 'Rejected' }),
      { status: 400 },
    ))
    await expect(submitOrder({ accessKey: 'key', form, items, fetchImpl })).rejects.toThrow('Rejected')
  })
})
