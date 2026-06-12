import type { Metadata } from 'next'
import InfoPage from '@/components/InfoPage'

export const metadata: Metadata = { title: 'Supplier Super Deals', alternates: { canonical: '/supplier-super-deals/' } }

export default function SupplierDealsPage() {
  return <InfoPage title="Supplier Super Deals" intro="Browse limited supplier offers, discounted packs, and promotional bundles." sections={[
    { heading: 'Limited availability', paragraphs: ['Supplier deals can end when the promotional inventory is exhausted. Product pages show the current price and pack options available in the catalog.'] },
    { heading: 'Combining promotions', paragraphs: ['Unless an offer explicitly says otherwise, supplier deals cannot be combined with another product-level discount on the same item.'] },
    { heading: 'Shipping', paragraphs: ['Products from different suppliers or shipping locations may arrive separately and can carry separate shipping charges.'] },
  ]} cta={{ href: '/catalog/', label: 'Shop Current Deals' }} />
}
