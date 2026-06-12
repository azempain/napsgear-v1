import type { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'

export const metadata: Metadata = { title: 'Choose New Password', robots: { index: false, follow: false } }

export default function ResetPasswordPage() {
  return <main className="main"><div className="container ngc-auth-page"><AuthForm mode="reset" /></div></main>
}
