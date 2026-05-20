import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with NapsGear support.',
  alternates: { canonical: '/contact-us/' },
}

export default function ContactPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">Contact Us</h1>
        <p className="text-muted">
          Content TBD — migrate from <code>offline/contact-us/index.html</code>.
        </p>
      </div>
    </main>
  )
}
