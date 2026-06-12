import type { CartItem } from '@/context/CartContext'
import { buildOrderPayload, checkoutSchema, type CheckoutForm } from './checkout'

const WEB3FORMS_URL = 'https://api.web3forms.com/submit'

export type OrderSubmission = {
  reference: string
}

export async function submitOrder({
  accessKey,
  form,
  items,
  fetchImpl = fetch,
  timeoutMs = 15_000,
}: {
  accessKey: string
  form: CheckoutForm
  items: CartItem[]
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): Promise<OrderSubmission> {
  if (!accessKey.trim()) throw new Error('Checkout is not configured.')
  if (items.length === 0) throw new Error('Your cart is empty.')

  const validForm = checkoutSchema.parse(form)
  const reference = createOrderReference()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        order_reference: reference,
        ...buildOrderPayload(validForm, items),
      }),
      signal: controller.signal,
    })
    const data = await response.json().catch(() => null) as { success?: boolean; message?: string } | null
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || 'The order service could not accept this order.')
    }
    return { reference }
  } finally {
    clearTimeout(timer)
  }
}

export function createOrderReference(now = new Date(), random = Math.random()) {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '')
  const suffix = Math.floor(random * 36 ** 6).toString(36).padStart(6, '0').toUpperCase()
  return `NG-${day}-${suffix}`
}
