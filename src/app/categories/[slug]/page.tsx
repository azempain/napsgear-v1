import { notFound } from 'next/navigation'
import { categories, products } from '@/data'
import ProductCard from '@/components/ProductCard'

export const dynamicParams = false

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }))
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">{category.name}</h1>
        <p className="text-muted mb-4">No products grabbed yet for this category.</p>
        {products.length > 0 && (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
            {products.slice(0, 20).map((p) => (
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
