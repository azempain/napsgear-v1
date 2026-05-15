import { notFound } from 'next/navigation'
import { brands, products } from '@/data'
import ProductCard from '@/components/ProductCard'

export const dynamicParams = false

export function generateStaticParams() {
  return brands.filter((b) => b.slug).map((b) => ({ slug: b.slug! }))
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const brand = brands.find((b) => b.slug === slug)
  if (!brand) notFound()

  const brandProducts = products.filter(
    (p) => p.brand && p.brand.toLowerCase() === brand.name.toLowerCase()
  )

  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">{brand.name}</h1>
        {brandProducts.length === 0 ? (
          <p className="text-muted">No products grabbed yet for this brand.</p>
        ) : (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
            {brandProducts.map((p) => (
              <div key={p.slug} className="col">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
