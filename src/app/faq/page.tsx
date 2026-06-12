import type { Metadata } from 'next'
import faqJson from '@/data/faq.json'
import type { FaqEntry } from '@/data/types'

const faq: FaqEntry[] = faqJson as FaqEntry[]

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about ordering, shipping, and product authenticity.',
  alternates: { canonical: '/faq/' },
}

export default function FAQPage() {
  // Group by category, preserving insertion order
  const groups = new Map<string, FaqEntry[]>()
  for (const e of faq) {
    const k = e.category ?? 'General'
    const arr = groups.get(k) ?? []
    arr.push(e)
    groups.set(k, arr)
  }

  return (
    <main className="main">
      <div className="container py-5">
        <article className="ngc-info-page">
          <header className="ngc-info-page__header">
            <h1>Frequently Asked Questions</h1>
            <p>Browse the original support topics by category. Each question opens its full NapsHelp knowledgebase article.</p>
          </header>
          {faq.length === 0 ? (
            <p className="text-muted">No FAQ entries available.</p>
          ) : (
            [...groups.entries()].map(([cat, entries]) => (
              <section key={cat} className="ngc-info-page__section">
                <h2>{cat}</h2>
                <ul className="list-unstyled">
                  {entries.map(e => (
                    <li key={e.id} className="mb-2" data-faq-q={e.id}>
                      {e.sourceUrl ? (
                        <a href={e.sourceUrl} rel="noreferrer">{e.question}</a>
                      ) : (
                        <strong>{e.question}</strong>
                      )}
                      {e.answer && (
                        <div className="text-muted mt-1" data-faq-a={e.id}>{e.answer}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
          <a className="ngc-btn ngc-btn--dark" href="/contact-us/">Contact Support</a>
        </article>
      </div>
    </main>
  )
}
