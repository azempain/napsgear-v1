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
        <article className="ngc-info-page">
          <header className="ngc-info-page__header">
            <h1>{c.heading ?? 'Contact Us'}</h1>
            <p>Use the support portal for account, order, payment, shipping, or product questions.</p>
          </header>

          {c.actions?.map(action => (
            <section key={action.label} className="ngc-info-page__section">
              <h2>{action.label}</h2>
              <p>{action.description}</p>
              <a href={action.href} rel="noreferrer">Open {action.label}</a>
            </section>
          ))}

          <section className="ngc-info-page__section">
            <h2>Managing support tickets</h2>
            <p>Register or sign in before submitting a ticket. After signing in, use the ticket list to review open and resolved requests.</p>
          </section>

          {c.portalUrl && <a className="ngc-btn ngc-btn--dark" href={c.portalUrl} rel="noreferrer">Visit NapsHelp</a>}
        </article>
      </div>
    </main>
  )
}
