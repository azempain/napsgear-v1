import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { categories, products } from '@/data'
import ProductTable from '@/components/ProductTable'
import JsonLd from '@/components/JsonLd'
import { breadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_NAME, absoluteUrl } from '@/lib/site'

export const dynamicParams = false

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const category = categories.find((c) => c.slug === slug)
  if (!category) return { title: 'Category not found' }
  const description = `Browse ${category.name} at ${SITE_NAME}.`
  return {
    title: category.name,
    description,
    alternates: { canonical: `/categories/${category.slug}/` },
    openGraph: {
      type: 'website',
      title: category.name,
      description,
      url: absoluteUrl(`/categories/${category.slug}/`),
    },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  // When the category has a productSlugs allowlist (populated by the saved-
  // pages extractor for categories with a captured product grid), filter to
  // those SKUs. Otherwise fall back to showing the full catalog so the route
  // isn't empty in dev.
  const list = category.productSlugs && category.productSlugs.length > 0
    ? products.filter(p => category.productSlugs!.includes(p.slug))
    : products

  const crumbs = breadcrumbJsonLd([
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/catalog/' },
    { name: category.name },
  ])

  return (
    <main className="main">
      <JsonLd data={crumbs} />
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
