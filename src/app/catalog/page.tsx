import { products } from '@/data'
import ProductCard from '@/components/ProductCard'

export default function CatalogPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="section-title ls-n-10 m-b-4">
          <span className="text-danger">All</span> Products
        </h1>
        {products.length === 0 ? (
          <p className="text-muted">No products available.</p>
        ) : (
          <div className="products-grid">
            {products.map(p => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
