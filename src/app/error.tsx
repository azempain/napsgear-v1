'use client'

import { useEffect } from 'react'

export default function Error({
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
    <main className="main">
      <div className="container py-5 text-center">
        <h1 className="display-1 fw-bold text-danger">500</h1>
        <h2 className="mb-3">Something went wrong</h2>
        <p className="text-muted mb-4">
          An unexpected error occurred. Please try again.
        </p>
        <button onClick={reset} className="btn btn-primary btn-lg me-2">
          Try again
        </button>
        <a href="/" className="btn btn-outline-secondary btn-lg">
          Back to Home
        </a>
      </div>
    </main>
  )
}
