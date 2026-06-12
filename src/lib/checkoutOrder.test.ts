import { describe, expect, it, vi } from 'vitest'
import type { CartItem } from '@/context/CartContext'
import type { CheckoutForm } from './checkout'
import { completeCheckout } from './checkoutOrder'

const form: CheckoutForm = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '5551234567',
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

describe('completeCheckout', () => {
  it('saves before emailing and records success', async () => {
    const calls: string[] = []
    const result = await completeCheckout({
      accessKey: 'key',
      currency: 'USD',
      form,
      items,
      reference: 'NG-20260612-ABC123',
      saveOrder: vi.fn(async () => {
        calls.push('save')
        return 'order-id'
      }),
      sendEmail: vi.fn(async () => {
        calls.push('email')
        return { reference: 'NG-20260612-ABC123' }
      }),
      markEmail: vi.fn(async (_id, status) => {
        calls.push(status)
      }),
    })

    expect(result).toEqual({ orderId: 'order-id', reference: 'NG-20260612-ABC123' })
    expect(calls).toEqual(['save', 'email', 'sent'])
  })

  it('keeps the saved order and records an email failure', async () => {
    const markEmail = vi.fn(async () => undefined)
    await expect(completeCheckout({
      accessKey: 'key',
      currency: 'USD',
      form,
      items,
      reference: 'NG-20260612-ABC123',
      saveOrder: vi.fn(async () => 'order-id'),
      sendEmail: vi.fn(async () => {
        throw new Error('Email unavailable')
      }),
      markEmail,
    })).rejects.toThrow('Email unavailable')

    expect(markEmail).toHaveBeenCalledWith('order-id', 'failed')
  })
})
