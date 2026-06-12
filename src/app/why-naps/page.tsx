import type { Metadata } from 'next'
import InfoPage from '@/components/InfoPage'

export const metadata: Metadata = {
  title: 'Why NapsGear',
  description: 'Why customers choose NapsGear — service, selection, shipping.',
  alternates: { canonical: '/why-naps/' },
}

export default function WhyNapsPage() {
  return <InfoPage title="Why NapsGear" intro="The original storefront combines a multi-supplier catalog with ordering tools, community references, and a dedicated support portal." sections={[
    { heading: 'A long-running catalog', paragraphs: ['The catalog is organized by brand, category, ingredient, and shipping location, with pack pricing and availability shown on individual product pages.'] },
    { heading: 'Customer references', paragraphs: ['Product reviews, customer questions, gear photos, diaries, and archived community content provide additional context around catalog listings and fulfillment experiences.'] },
    { heading: 'Multiple shipping locations', paragraphs: ['Listings are grouped by fulfillment region so customers can compare domestic and international options before ordering. Delivery expectations and customs notes are published separately on the shipping page.'] },
    { heading: 'Dedicated support', paragraphs: ['The NapsHelp portal provides registration, ticket submission, ticket history, and a categorized knowledgebase for common account and order questions.'] },
  ]} cta={{ href: '/catalog/', label: 'Browse the Catalog' }} />
}
