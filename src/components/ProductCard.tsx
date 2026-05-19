import type { Product } from '@/data/types'
import ProductImage from './ProductImage'

export default function ProductCard({ product }: { product: Product }) {
  const thumb = product.images[0] ?? ''
  const href = `/${product.slug}/`
  return (
    <div className="product-item" data-id={product.slug}>
      <figure className="product-item__info">
        <div className="label-group label-group--left">
          {product.labels?.new && (
            <div className="product-label label-new"><div className="newLabel"><b>NEW!</b></div></div>
          )}
        </div>
        <div className="label-group label-group--right d-flex flex-column gap-2 text-center">
          {product.labels?.sale && (
            <div className="product-label label-sale" title={`Sale ${product.labels.sale}`}>
              <span>{product.labels.sale}</span>
            </div>
          )}
        </div>
        <div className="d-flex">
          <a className="btn-quick-view" href={href} aria-label={`Quick view ${product.name}`}>
            <svg fill="#000000" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 37.519 37.519">
              <path d="M37.087,17.705c-0.334-0.338-8.284-8.276-18.327-8.276S0.766,17.367,0.433,17.705c-0.577,0.584-0.577,1.523,0,2.107c0.333,0.34,8.284,8.277,18.327,8.277s17.993-7.938,18.327-8.275C37.662,19.23,37.662,18.29,37.087,17.705z M18.76,25.089c-6.721,0-12.604-4.291-15.022-6.332c2.411-2.04,8.281-6.328,15.022-6.328c6.72,0,12.604,4.292,15.021,6.332C31.369,20.802,25.501,25.089,18.76,25.089z M18.76,13.009c3.176,0,5.75,2.574,5.75,5.75c0,3.175-2.574,5.75-5.75,5.75c-3.177,0-5.75-2.574-5.75-5.75C13.01,15.584,15.583,13.009,18.76,13.009z" />
            </svg>
            QUICK VIEW
          </a>
        </div>
        <a className="product-item__image" href={href} title={product.name}>
          {thumb ? (
            <ProductImage src={thumb} alt={product.name} />
          ) : (
            <span className="product-image-photo bg-gray-100" aria-hidden="true" />
          )}
        </a>
      </figure>
      <div className="product-item__details">
        {product.brand && (
          <div className="product-item__manufacturer">{product.brand}</div>
        )}
        <h3 className="product-item__title">
          <a href={href} title={product.name}>{product.name}</a>
        </h3>
        <div className="product-item__status">
          {product.price && (
            <div className="price-box"><span className="product-price">{product.price}</span></div>
          )}
          <div className="d-flex align-items-center" />
        </div>
        <div className="product-item__action">
          <a href={href} className="btn-add-cart product-type-simple" title="View Product">
            <span>SELECT OPTIONS</span>
          </a>
        </div>
      </div>
    </div>
  )
}
