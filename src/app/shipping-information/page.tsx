import type { Metadata } from 'next'
import shippingJson from '@/data/shipping.json'
import type { ShippingDoc } from '@/data/types'

const doc: ShippingDoc = shippingJson as ShippingDoc

export const metadata: Metadata = {
  title: 'Shipping & Returns',
  description: 'Shipping policy, delivery times, and return process at NapsGear.',
  alternates: { canonical: '/shipping-information/' },
}

export default function ShippingPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">Shipping &amp; Returns</h1>
        {doc.sections.length === 0 ? (
          <p className="text-muted">Shipping policy content is being prepared.</p>
        ) : (
          doc.sections.map((s, i) => (
            <section key={i} className="mb-4">
              <h2 className="h5">{s.heading}</h2>
              {s.paras?.map((p, j) => <p key={j}>{p}</p>)}
              {s.list && (
                <ul>{s.list.map((li, j) => <li key={j}>{li}</li>)}</ul>
              )}
            </section>
          ))
        )}
      </div>
    </main>
  )
}
