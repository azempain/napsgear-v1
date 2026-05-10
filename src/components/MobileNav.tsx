import { brands, categories } from '@/data'

export default function MobileNav() {
  return (
    <nav id="navigationMenu" className="md:hidden border-b border-gray-200 bg-white">
      <details className="border-b border-gray-100">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Brands</summary>
        <div className="bg-gray-50">
          {brands.filter(b => b.slug).map((b) => (
            <a
              key={b.slug}
              href={`/brands/${b.slug!}/`}
              className="block px-6 py-2 text-sm hover:bg-white"
            >
              {b.name}
            </a>
          ))}
        </div>
      </details>
      <details className="border-b border-gray-100">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Categories</summary>
        <div className="bg-gray-50">
          {categories.map((c) => (
            <a
              key={c.slug}
              href={`/categories/${c.slug}/`}
              className="block px-6 py-2 text-sm hover:bg-white"
            >
              {c.name}
            </a>
          ))}
        </div>
      </details>
      <a href="/faq/" className="block border-b border-gray-100 px-4 py-3 text-sm">FAQ</a>
      <a href="/shipping-information/" className="block border-b border-gray-100 px-4 py-3 text-sm">Shipping</a>
      <a href="/contact-us/" className="block px-4 py-3 text-sm">Contact</a>
    </nav>
  )
}
