import { notFound } from 'next/navigation'
import { brands, products, ingredients } from '@/data'
import BrandListing from '@/components/BrandListing'

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
  const brandIngredients = ingredients.filter(
    (i) => i.brand.toLowerCase() === brand.name.toLowerCase()
  )

  return (
    <main className="main">
      <div className="container">
        {brandProducts.length === 0 ? (
          <div className="py-5">
            <h2 className="category-title">{brand.name}</h2>
            <p className="text-muted">No products grabbed yet for this brand.</p>
          </div>
        ) : (
          <BrandListing
            brandName={brand.name}
            products={brandProducts}
            ingredients={brandIngredients}
          />
        )}
      </div>
    </main>
  )
}
