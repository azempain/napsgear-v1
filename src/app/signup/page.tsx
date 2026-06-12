import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'

export const metadata: Metadata = { title: 'Create Account', robots: { index: false, follow: false } }

export default function SignupPage() {
  return <main className="main"><div className="container ngc-auth-page"><AuthForm mode="signup" /></div></main>
}
