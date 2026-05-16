import { notFound } from 'next/navigation'
import { products } from '@/data'
import ProductDetail from '@/components/ProductDetail'

export const dynamicParams = false

export function generateStaticParams() {
  const slugs = products.map((p) => p.slug).filter(Boolean)
  if (slugs.length === 0) return [{ productSlug: '_empty' }]
  return slugs.map((slug) => ({ productSlug: slug }))
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
    <main className="main">
      <div className="container py-5">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            {product.brand && (
              <li className="breadcrumb-item">{product.brand}</li>
            )}
            <li className="breadcrumb-item active" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>
        <ProductDetail product={product} />
      </div>
    </main>
  )
}
