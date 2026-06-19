'use client'

// Self-contained hCaptcha widget (explicit-render API, no npm dependency).
// Loads the hCaptcha script once per page, renders a checkbox widget, and
// reports the solved token up via onVerify. Clears the token on expiry/error
// so the parent form can re-gate submission.

import { useEffect, useRef } from 'react'
import { HCAPTCHA_SITE_KEY, HCAPTCHA_SCRIPT_SRC } from '@/lib/hcaptcha'

interface HCaptchaApi {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    hcaptcha?: HCaptchaApi
  }
}

let scriptPromise: Promise<void> | null = null

function loadHCaptcha(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.hcaptcha) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = HCAPTCHA_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('hCaptcha failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export default function HCaptcha({
  onVerify,
  onExpire,
}: {
  onVerify: (token: string) => void
  onExpire?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadHCaptcha()
      .then(() => {
        if (cancelled || !containerRef.current || !window.hcaptcha) return
        // Guard against double-render under React StrictMode.
        if (widgetIdRef.current !== null) return
        widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
          sitekey: HCAPTCHA_SITE_KEY,
          callback: token => onVerify(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onExpire?.(),
        })
      })
      .catch(() => {
        /* network/script error — parent stays un-verified, submit stays gated */
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current !== null && window.hcaptcha) {
        try {
          window.hcaptcha.remove(widgetIdRef.current)
        } catch {
          /* widget already gone */
        }
        widgetIdRef.current = null
      }
    }
  }, [onVerify, onExpire])

  return <div ref={containerRef} className="ngc-hcaptcha" />
}
