import type { Metadata } from 'next'
import { products } from '@/data'
import ProductTable from '@/components/ProductTable'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'All Products',
  description: `Browse every product available at ${SITE_NAME} — search, sort, and filter by brand or ingredient.`,
  alternates: { canonical: '/catalog/' },
}

export default function CatalogPage() {
  return (
    <main className="main">
      <div className="container">
        <ProductTable
          products={products}
          title="All Products"
          emptyMessage="No products available."
        />
      </div>
    </main>
  )
}
