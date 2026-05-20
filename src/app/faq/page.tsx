import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about ordering, shipping, and product authenticity.',
  alternates: { canonical: '/faq/' },
}

export default function FAQPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">Frequently Asked Questions</h1>
        <p className="text-muted">
          Content TBD — migrate from <code>offline/faq/index.html</code> once grabbed.
        </p>
      </div>
    </main>
  )
}
