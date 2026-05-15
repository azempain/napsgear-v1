import { products } from '@/data'
import ProductCard from './ProductCard'

export default function ProductsSection() {
  if (!products.length) return null

  return (
    <section className="products-firstpage-section firstpage-section mb-5">
      <h2 className="section-title ls-n-10 m-b-4">
        <span className="text-danger">Featured</span> Products
      </h2>
      <div className="products-grid">
        {products.map(p => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
      <a className="btn btn-outline-primary btn-sm mt-3" href="/catalog/">
        SEE ALL PRODUCTS &#x2192;
      </a>
    </section>
  )
}
