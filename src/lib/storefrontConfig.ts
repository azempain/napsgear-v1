const trim = (value: string | undefined) => value?.trim() ?? ''

export const SUPPORT_EMAIL = trim(process.env.NEXT_PUBLIC_SUPPORT_EMAIL)
export const SUPPORT_WHATSAPP = trim(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP)
export const BTC_WALLET_ADDRESS = trim(process.env.NEXT_PUBLIC_BTC_WALLET_ADDRESS)
export const BTC_PAYMENT_URL = trim(process.env.NEXT_PUBLIC_BTC_PAYMENT_URL)

export function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, '')
}

export function buildWhatsAppHref(value = SUPPORT_WHATSAPP) {
  const digits = normalizeWhatsAppNumber(value)
  return digits ? `https://wa.me/${digits}` : ''
}

export function buildPaymentHref({
  reference,
  total,
  baseUrl = BTC_PAYMENT_URL,
}: {
  reference: string
  total: string
  baseUrl?: string
}) {
  const href = baseUrl.trim()
  if (!href) return ''
  return href
    .replaceAll('{reference}', encodeURIComponent(reference))
    .replaceAll('{total}', encodeURIComponent(total))
}

export function renderBitcoinInstructions({
  reference,
  total,
  wallet = BTC_WALLET_ADDRESS,
  paymentUrl = BTC_PAYMENT_URL,
  supportEmail = SUPPORT_EMAIL,
  supportWhatsApp = SUPPORT_WHATSAPP,
}: {
  reference: string
  total: string
  wallet?: string
  paymentUrl?: string
  supportEmail?: string
  supportWhatsApp?: string
}) {
  return [
    'Payment method: Bitcoin',
    `Order reference: ${reference}`,
    `Order total: ${total}`,
    wallet ? `BTC wallet: ${wallet}` : '',
    paymentUrl ? `Payment link: ${buildPaymentHref({ reference, total, baseUrl: paymentUrl })}` : '',
    supportEmail ? `Support email: ${supportEmail}` : '',
    supportWhatsApp ? `WhatsApp: ${supportWhatsApp}` : '',
    'Send Bitcoin payment and include the order reference when contacting support.',
  ].filter(Boolean).join('\n')
}
