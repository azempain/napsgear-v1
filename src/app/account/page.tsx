import type { Metadata } from 'next'
import AccountView from '@/components/AccountView'

export const metadata: Metadata = { title: 'My Account', robots: { index: false, follow: false } }

export default function AccountPage() {
  return <main className="main"><div className="container py-5"><AccountView /></div></main>
}
