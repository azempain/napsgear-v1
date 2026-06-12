import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'

export const metadata: Metadata = { title: 'Reset Password', robots: { index: false, follow: false } }

export default function ForgotPasswordPage() {
  return <main className="main"><div className="container ngc-auth-page"><AuthForm mode="forgot" /></div></main>
}
