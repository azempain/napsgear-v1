import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'
import { products } from '@/data'

export const dynamicParams = false

export function generateStaticParams() {
  if (products.length === 0) return [{ productSlug: '_empty' }]
  return products.map((p) => ({ productSlug: p.slug }))
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productSlug: string }>
}) {
  const { productSlug } = await params
  const product = products.find((p) => p.slug === productSlug)
  if (!product) notFound()

  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">{product.name}</h1>
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="mb-6 w-full max-w-md rounded border border-gray-200"
          />
        )}
        <p className="whitespace-pre-line text-gray-700">{product.description}</p>
      </main>
      <Footer />
    </>
  )
}
