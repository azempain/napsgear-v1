import { notFound } from 'next/navigation'
import { categories, products } from '@/data'
import ProductTable from '@/components/ProductTable'

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

  // Until per-category product data is captured, the grid falls back to
  // showing a sampling of all products so the route isn't empty in dev.
  // ProductTable's toolbar still lets visitors narrow what they see.
  const list = products

  return (
    <main className="main">
      <div className="container">
        <ProductTable
          title={category.name}
          products={list}
          emptyMessage="No products available for this category yet."
        />
      </div>
    </main>
  )
}
