import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="main">
      <div className="container py-5 text-center">
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h2 className="mb-3">Page Not Found</h2>
        <p className="text-muted mb-4">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn btn-primary btn-lg">
          Back to Home
        </Link>
      </div>
    </main>
  )
}
