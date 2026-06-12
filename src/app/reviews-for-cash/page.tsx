import type { Metadata } from 'next'
import InfoPage from '@/components/InfoPage'

export const metadata: Metadata = { title: 'Reviews for Cash', alternates: { canonical: '/reviews-for-cash/' } }

export default function ReviewsForCashPage() {
  return <InfoPage title="Reviews for Cash" intro="Share a useful, product-specific review and receive store credit when it meets the program requirements." sections={[
    { heading: 'What makes a useful review', items: ['Describe the exact product and pack ordered.', 'Focus on packaging, ordering experience, and product-specific observations.', 'Write original content with enough detail to help another customer.', 'Keep personal information and order identifiers out of the public review.'] },
    { heading: 'Review process', paragraphs: ['Reviews are checked for relevance, originality, and compliance before publication. Approval and credit values can vary by promotion and are not guaranteed for every submission.'] },
    { heading: 'Fair-use policy', paragraphs: ['One review per purchased product is eligible. Incentives reward the effort of writing a useful review and do not require a positive rating.'] },
  ]} cta={{ href: '/catalog/', label: 'Browse Products' }} />
}
