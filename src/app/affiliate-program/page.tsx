import type { Metadata } from 'next'
import affiliateJson from '@/data/affiliate.json'
import type { AffiliateDoc } from '@/data/types'

const doc: AffiliateDoc = affiliateJson as AffiliateDoc

export const metadata: Metadata = {
  title: 'Affiliate Program',
  description: 'Earn commission on every NapsGear order through your tracking link.',
  alternates: { canonical: '/affiliate-program/' },
}

export default function AffiliatePage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-3">{doc.heading}</h1>
        {doc.intro && (
          <div className="lead mb-4" style={{ whiteSpace: 'pre-line' }}>{doc.intro}</div>
        )}
        {doc.sections.map((s, i) => (
          <section key={i} className="mb-4">
            <h2 className="h5">{s.heading}</h2>
            {s.paras.map((p, j) => <p key={j}>{p}</p>)}
          </section>
        ))}
        {doc.cta && (
          <a className="btn btn-dark mt-3" href={doc.cta.href}>{doc.cta.label}</a>
        )}
      </div>
    </main>
  )
}
