import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'

export const metadata: Metadata = { title: 'Sign In', robots: { index: false, follow: false } }

export default function LoginPage() {
  return <main className="main"><div className="container ngc-auth-page"><AuthForm mode="login" /></div></main>
}
