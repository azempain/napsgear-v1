'use client'

import Link from 'next/link'
import { useAuthSession, useSignOut } from '@/lib/authSession'
import { useMyOrders } from '@/lib/ordersQuery'

export default function AccountView() {
  const { data: session, isPending } = useAuthSession()
  const signOut = useSignOut()
  const orders = useMyOrders(session?.user.id)

  if (isPending) return <p className="ngc-list__empty">Loading account...</p>
  if (!session) {
    return (
      <div className="ngc-auth-card">
        <h1 className="ngc-auth-card__title">My Account</h1>
        <p>You need to sign in to view your account.</p>
        <Link className="ngc-btn ngc-btn--dark" href="/login/">Sign In</Link>
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
        <Link className="ngc-btn ngc-btn--outline" href="/cart/">View Cart</Link>
        <button
          type="button"
          className="ngc-btn ngc-btn--dark"
          disabled={signOut.isPending}
          onClick={async () => {
            await signOut.mutateAsync()
            window.location.assign('/')
          }}
        >
          {signOut.isPending ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>

      <section className="ngc-account-orders" aria-labelledby="orders-title">
        <h2 id="orders-title">Recent orders</h2>
        {orders.isPending && <p>Loading orders...</p>}
        {orders.isError && <div className="ngc-alert" role="alert">{orders.error.message}</div>}
        {orders.data?.length === 0 && <p className="ngc-list__empty">You have not placed an order yet.</p>}
        {orders.data && orders.data.length > 0 && (
          <div className="ngc-order-list">
            {orders.data.map(order => (
              <article key={order.id} className="ngc-order-row">
                <div>
                  <strong>{order.reference}</strong>
                  <time dateTime={order.created_at}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </time>
                </div>
                <span>{order.status.replaceAll('_', ' ')}</span>
                <strong>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: order.currency,
                  }).format(Number(order.order_total))}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
