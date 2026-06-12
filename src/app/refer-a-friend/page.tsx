import type { Metadata } from 'next'
import InfoPage from '@/components/InfoPage'

export const metadata: Metadata = { title: 'Refer NapsGear for Cash', alternates: { canonical: '/refer-a-friend/' } }

export default function ReferFriendPage() {
  return <InfoPage title="Refer NapsGear for Cash" intro="Registered customers can share a personal referral link and earn account credit from qualifying referrals." sections={[
    { heading: 'How it works', items: ['Sign in and open your account page.', 'Copy your personal referral link.', 'Share it directly with eligible new customers.', 'Qualifying activity is credited according to the active referral terms.'] },
    { heading: 'Eligibility', paragraphs: ['Self-referrals, duplicate accounts, unsolicited bulk messages, paid search impersonation, and misleading promotion are prohibited. Referral attribution depends on the customer using the tracked link and completing the qualifying action.'] },
  ]} cta={{ href: '/account/', label: 'Open My Account' }} />
}
