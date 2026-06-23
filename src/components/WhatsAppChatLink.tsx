import { buildWhatsAppHref } from '@/lib/storefrontConfig'

export default function WhatsAppChatLink() {
  const href = buildWhatsAppHref()
  if (!href) return null

  return (
    <a
      className="ngc-whatsapp-chat"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with NapsGear support on WhatsApp"
    >
      <span aria-hidden="true">WA</span>
    </a>
  )
}
