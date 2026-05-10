import type { Product } from '@/data/types'

export default function ProductCard({ product }: { product: Product }) {
  const thumb = product.images[0] ?? ''
  return (
    <article className="widget-gearpics__item flex flex-col overflow-hidden rounded border border-gray-200 bg-white">
      {thumb ? (
        <img
          src={thumb}
          alt={product.name}
          className="aspect-square w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="aspect-square w-full bg-gray-100" aria-hidden="true" />
      )}
      <div className="p-3">
        <a
          href={`/${product.slug}/`}
          className="line-clamp-2 text-sm font-medium hover:underline"
        >
          {product.name}
        </a>
      </div>
    </article>
  )
}
