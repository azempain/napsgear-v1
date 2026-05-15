import { notFound } from 'next/navigation'
import { products } from '@/data'

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
        <h1 className="mb-4">{product.name}</h1>
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="mb-4 img-fluid rounded border product-image"
          />
        )}
        <p className="text-muted">{product.description}</p>
      </div>
    </main>
  )
}
