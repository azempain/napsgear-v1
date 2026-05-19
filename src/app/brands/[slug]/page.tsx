import { notFound } from 'next/navigation'
import { brands, products, ingredients } from '@/data'
import ProductTable from '@/components/ProductTable'

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
        <ProductTable
          title={brand.name}
          products={brandProducts}
          ingredients={brandIngredients}
          emptyMessage={
            brandProducts.length === 0
              ? 'No products grabbed yet for this brand.'
              : 'No products match your filters.'
          }
        />
      </div>
    </main>
  )
}
