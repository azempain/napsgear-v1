import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'
import { categories, products } from '@/data'
import ProductCard from '@/components/ProductCard'

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
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">{category.name}</h1>
        <p className="mb-8 text-gray-600">No products grabbed yet for this category.</p>
        {products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.slice(0, 20).map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
