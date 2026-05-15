import type { Product } from '@/data/types'

export default function ProductCard({ product }: { product: Product }) {
  const thumb = product.images[0] ?? ''
  return (
    <article className="product-item-info">
      <div className="product-item-photo">
        <a href={`/${product.slug}/`} title={product.name}>
          {thumb ? (
            <img
              src={thumb}
              alt={product.name}
              className="product-image-photo"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="product-image-photo bg-gray-100" aria-hidden="true" />
          )}
        </a>
      </div>
      <div className="product-item-details">
        {product.brand && (
          <p className="product-item-brand">{product.brand}</p>
        )}
        <h2 className="product-item-name">
          <a href={`/${product.slug}/`} title={product.name}>
            {product.name}
          </a>
        </h2>
        {product.price && (
          <div className="price-box">
            <span className="price">{product.price}</span>
          </div>
        )}
      </div>
    </article>
  )
}
