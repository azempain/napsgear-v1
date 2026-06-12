'use client'

import { User } from 'lucide-react'
import Link from 'next/link'
import { useAuthSession } from '@/lib/authSession'
import MobileAccountSheet from './MobileAccountSheet'

export default function AccountLink() {
  const { data: session } = useAuthSession()
  return (
    <>
      <Link
        className="header-icon header-icon-user ngc-account-link--desktop"
        href={session ? '/account/' : '/login/'}
        aria-label={session ? `Account for ${session.user.name}` : 'Sign in'}
        title={session ? session.user.name : 'Sign in'}
      >
        <User size={20} aria-hidden="true" />
        {session && <span className="ngc-account-presence" aria-hidden="true" />}
      </Link>
      <MobileAccountSheet />
    </>
  )
}
