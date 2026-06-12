'use client'

import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { listMyOrders } from '@/lib/orderPersistence'

export default function AccountView() {
  const { data: session, isPending } = authClient.useSession()
  const orders = useQuery({
    queryKey: ['orders', session?.user.id],
    queryFn: listMyOrders,
    enabled: Boolean(session),
  })

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
          onClick={async () => {
            await authClient.signOut()
            window.location.assign('/')
          }}
        >
          Sign Out
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
