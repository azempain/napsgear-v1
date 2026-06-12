'use client'

import { User } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export default function AccountLink() {
  const { data: session } = authClient.useSession()
  return (
    <a
      className="header-icon header-icon-user"
      href={session ? '/account/' : '/login/'}
      aria-label={session ? `Account for ${session.user.name}` : 'Sign in'}
      title={session ? session.user.name : 'Sign in'}
    >
      <User size={20} aria-hidden="true" />
    </a>
  )
}
