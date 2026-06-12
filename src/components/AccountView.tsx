'use client'

import { authClient } from '@/lib/auth-client'

export default function AccountView() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return <p className="ngc-list__empty">Loading account...</p>
  if (!session) {
    return (
      <div className="ngc-auth-card">
        <h1 className="ngc-auth-card__title">My Account</h1>
        <p>You need to sign in to view your account.</p>
        <a className="ngc-btn ngc-btn--dark" href="/login/">Sign In</a>
      </div>
    )
  }

  return (
    <section className="ngc-account">
      <h1>My Account</h1>
      <div className="ngc-account__card">
        <div><strong>Name</strong><span>{session.user.name}</span></div>
        <div><strong>Email</strong><span>{session.user.email}</span></div>
      </div>
      <div className="ngc-account__actions">
        <a className="ngc-btn ngc-btn--outline" href="/cart/">View Cart</a>
        <button
          type="button"
          className="ngc-btn ngc-btn--dark"
          onClick={async () => {
            await authClient.signOut()
            window.location.assign('/')
          }}
        >
          Sign Out
        </button>
      </div>
    </section>
  )
}
