import type { Metadata } from 'next'
import InfoPage from '@/components/InfoPage'

export const metadata: Metadata = { title: 'Earn Store Credit', alternates: { canonical: '/store-credit/' } }

export default function StoreCreditPage() {
  return <InfoPage title="Earn Store Credit" intro="Use community and referral programs to build credit toward future orders." sections={[
    { heading: 'Ways to earn', items: ['Answer eligible community questions.', 'Refer new customers through your account link.', 'Submit approved product reviews and customer gear photos.', 'Watch the promotions page for limited-time credit offers.'] },
    { heading: 'How credit is applied', paragraphs: ['Approved credit is associated with your customer account. Available balances and program-specific limits are shown before checkout when the feature applies.'] },
    { heading: 'Program rules', paragraphs: ['Duplicate accounts, self-referrals, copied submissions, manipulated voting, and misleading reviews are not eligible. Credits have no cash value and may be subject to promotion-specific expiration dates.'] },
  ]} cta={{ href: '/signup/', label: 'Create an Account' }} />
}
