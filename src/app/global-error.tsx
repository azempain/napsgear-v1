'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#dc3545' }}>Error</h1>
          <h2 style={{ marginBottom: '1rem' }}>Something went critically wrong</h2>
          <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
            The application encountered a fatal error.
          </p>
          <button
            onClick={reset}
            style={{ padding: '12px 28px', background: '#0089cb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
