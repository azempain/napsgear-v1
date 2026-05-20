import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { brands, products, ingredients } from '@/data'
import ProductTable from '@/components/ProductTable'
import JsonLd from '@/components/JsonLd'
import { breadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_NAME, absoluteUrl } from '@/lib/site'

export const dynamicParams = false

export function generateStaticParams() {
  return brands.filter((b) => b.slug).map((b) => ({ slug: b.slug! }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const brand = brands.find((b) => b.slug === slug)
  if (!brand) return { title: 'Brand not found' }
  const count = products.filter(
    (p) => p.brand && p.brand.toLowerCase() === brand.name.toLowerCase(),
  ).length
  const description =
    count > 0
      ? `Browse ${count} ${brand.name} product${count === 1 ? '' : 's'} at ${SITE_NAME}.`
      : `${brand.name} catalog at ${SITE_NAME}.`
  return {
    title: brand.name,
    description,
    alternates: { canonical: `/brands/${brand.slug}/` },
    openGraph: {
      type: 'website',
      title: brand.name,
      description,
      url: absoluteUrl(`/brands/${brand.slug}/`),
    },
  }
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

  const crumbs = breadcrumbJsonLd([
    { name: 'Home', href: '/' },
    { name: 'Brands', href: '/catalog/' },
    { name: brand.name },
  ])

  return (
    <main className="main">
      <JsonLd data={crumbs} />
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
