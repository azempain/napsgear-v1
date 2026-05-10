import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'
import { brands, products } from '@/data'
import ProductCard from '@/components/ProductCard'

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

  const brandProducts = products.filter((p) => p.slug.includes(brand.slug!.split('-c')[0]))

  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">{brand.name}</h1>
        {brandProducts.length === 0 ? (
          <p className="text-gray-600">No products grabbed yet for this brand.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {brandProducts.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
