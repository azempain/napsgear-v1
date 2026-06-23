import type { Metadata } from 'next'
import { productsBySlug } from '@/data'
import ProductDetail from '@/components/ProductDetail'

const featured = productsBySlug.get('anastrozole')
export const metadata: Metadata = { title: 'Product of the Week', alternates: { canonical: '/product-of-the-week/' } }

export default function ProductOfWeekPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">Product of the Week</h1>
        {featured ? <ProductDetail product={featured} /> : <p className="ngc-list__empty">The next featured product is being selected.</p>}
      </div>
    </main>
  )
}
