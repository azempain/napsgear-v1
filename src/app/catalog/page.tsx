import { products } from '@/data'
import ProductTable from '@/components/ProductTable'

export default function CatalogPage() {
  return (
    <main className="main">
      <div className="container">
        <ProductTable
          products={products}
          title="All Products"
          emptyMessage="No products available."
        />
      </div>
    </main>
  )
}
