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
  captchaToken,
  saveOrder = persistOrder,
  sendEmail = submitOrder,
  markEmail = setOrderEmailStatus,
}: {
  accessKey?: string
  currency: string
  form: CheckoutForm
  items: CartItem[]
  reference?: string
  captchaToken?: string
  saveOrder?: typeof persistOrder
  sendEmail?: typeof submitOrder
  markEmail?: typeof setOrderEmailStatus
}) {
  let orderId: string | null = null
  let persistenceWarning: string | undefined

  try {
    orderId = await saveOrder({ reference, currency, form, items })
  } catch (error) {
    persistenceWarning = error instanceof Error ? error.message : 'Order history could not be saved.'
  }

  if (!accessKey) {
    return { orderId, reference, persistenceWarning }
  }

  try {
    await sendEmail({ accessKey, form, items, reference, captchaToken })
    if (orderId) await markEmail(orderId, 'sent')
  } catch (error) {
    if (orderId) await markEmail(orderId, 'failed').catch(() => undefined)
    throw error
  }

  return { orderId, reference, persistenceWarning }
}
