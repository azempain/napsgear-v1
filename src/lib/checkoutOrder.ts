import type { CartItem } from '@/context/CartContext'
import type { CheckoutForm } from './checkout'
import { createOrderReference, submitOrder } from './orderSubmission'
import { persistOrder, setOrderEmailStatus } from './orderPersistence'

export async function completeCheckout({
  accessKey,
  currency,
  form,
  items,
  reference = createOrderReference(),
  saveOrder = persistOrder,
  sendEmail = submitOrder,
  markEmail = setOrderEmailStatus,
}: {
  accessKey: string
  currency: string
  form: CheckoutForm
  items: CartItem[]
  reference?: string
  saveOrder?: typeof persistOrder
  sendEmail?: typeof submitOrder
  markEmail?: typeof setOrderEmailStatus
}) {
  const orderId = await saveOrder({ reference, currency, form, items })

  try {
    await sendEmail({ accessKey, form, items, reference })
    await markEmail(orderId, 'sent')
  } catch (error) {
    await markEmail(orderId, 'failed').catch(() => undefined)
    throw error
  }

  return { orderId, reference }
}
