import { ImageResponse } from 'next/og'

// Apple home-screen icon, generated at build by next/og.
// 180×180 PNG, brand-blue tile with white "NG" — matches src/app/icon.svg.
// `force-static` is required when next.config has `output: 'export'` —
// Next evaluates this once at build and emits a static PNG into /out.
export const dynamic = 'force-static'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0089cb',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: -3,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        }}
      >
        NG
      </div>
    ),
    size,
  )
}
