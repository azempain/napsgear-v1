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
  reference = createOrderReference(),
  captchaToken,
}: {
  accessKey: string
  form: CheckoutForm
  items: CartItem[]
  fetchImpl?: typeof fetch
  timeoutMs?: number
  reference?: string
  /** hCaptcha token from the widget. When hCaptcha is enabled in the Web3Forms
   *  dashboard, the provider rejects any submission whose `h-captcha-response`
   *  is missing or invalid — so this is the real anti-abuse gate for the
   *  publicly-keyed email endpoint, not the (ineffective-here) honeypot. */
  captchaToken?: string
}): Promise<OrderSubmission> {
  if (!accessKey.trim()) throw new Error('Checkout is not configured.')
  if (items.length === 0) throw new Error('Your cart is empty.')

  const validForm = checkoutSchema.parse(form)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        order_reference: reference,
        ...buildOrderPayload(validForm, items, reference),
        ...(captchaToken ? { 'h-captcha-response': captchaToken } : {}),
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
