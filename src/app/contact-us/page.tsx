import type { Metadata } from 'next'
import contactJson from '@/data/contact.json'
import type { ContactInfo } from '@/data/types'

const c: ContactInfo = contactJson as ContactInfo

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with NapsGear support.',
  alternates: { canonical: '/contact-us/' },
}

export default function ContactPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">{c.heading ?? 'Contact Us'}</h1>

        {c.email || c.phone || c.hours || c.address ? (
          <ul className="list-unstyled mb-4">
            {c.email && (
              <li className="mb-2">
                <strong>Email:</strong> <a href={`mailto:${c.email}`}>{c.email}</a>
              </li>
            )}
            {c.phone && <li className="mb-2"><strong>Phone:</strong> {c.phone}</li>}
            {c.hours && <li className="mb-2"><strong>Hours:</strong> {c.hours}</li>}
            {c.address && <li className="mb-2"><strong>Address:</strong> {c.address}</li>}
          </ul>
        ) : null}

        {c.portalUrl && (
          <p>
            For account-specific questions, file a ticket at the{' '}
            <a href={c.portalUrl} rel="noreferrer">NapsHelp support portal</a>.
          </p>
        )}
      </div>
    </main>
  )
}
