'use client'

import { LogOut, Package, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuthSession, useSignOut } from '@/lib/authSession'
import { useMyOrders } from '@/lib/ordersQuery'
import { useAppUiStore } from '@/store/appUiStore'

export default function MobileAccountSheet() {
  const open = useAppUiStore(state => state.mobileAccountOpen)
  const setOpen = useAppUiStore(state => state.setMobileAccountOpen)
  const { data: session, isPending } = useAuthSession()
  const signOut = useSignOut()
  const orders = useMyOrders(session?.user.id, open)

  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="header-icon header-icon-user ngc-account-trigger--mobile"
          aria-label={session ? `Open account for ${session.user.name}` : 'Open account menu'}
          aria-expanded={open ? 'true' : 'false'}
          aria-controls="mobileAccountSheet"
        >
          <User size={21} aria-hidden="true" />
          {session && <span className="ngc-account-presence" aria-hidden="true" />}
        </button>
      </SheetTrigger>

      <SheetContent
        id="mobileAccountSheet"
        className="ngc-account-sheet"
        aria-describedby="mobile-account-description"
      >
        <SheetTitle className="sr-only">Account</SheetTitle>
        <SheetDescription id="mobile-account-description" className="sr-only">
          View your account, recent orders, cart, and sign out.
        </SheetDescription>

        {isPending ? (
          <div className="ngc-account-sheet__loading">Loading your account...</div>
        ) : session ? (
          <>
            <header className="ngc-account-sheet__profile">
              <span className="ngc-account-sheet__avatar" aria-hidden="true">
                {session.user.name?.charAt(0).toUpperCase() || 'A'}
              </span>
              <div>
                <p>Signed in as</p>
                <strong>{session.user.name}</strong>
                <span>{session.user.email}</span>
              </div>
            </header>

            <nav className="ngc-account-sheet__links" aria-label="Account shortcuts">
              <Link href="/account/" onClick={close}>
                <User size={18} aria-hidden="true" />
                My Account
              </Link>
              <Link href="/cart/" onClick={close}>
                <ShoppingCart size={18} aria-hidden="true" />
                View Cart
              </Link>
            </nav>

            <section className="ngc-account-sheet__orders" aria-labelledby="mobile-orders-title">
              <div className="ngc-account-sheet__section-title">
                <h2 id="mobile-orders-title">Recent orders</h2>
                <Package size={18} aria-hidden="true" />
              </div>
              {orders.isPending && <p>Loading orders...</p>}
              {orders.isError && <p className="ngc-account-sheet__muted">Orders are temporarily unavailable.</p>}
              {orders.data?.length === 0 && (
                <p className="ngc-account-sheet__muted">No orders yet.</p>
              )}
              {orders.data?.slice(0, 3).map(order => (
                <Link
                  key={order.id}
                  href="/account/"
                  className="ngc-account-sheet__order"
                  onClick={close}
                >
                  <span>
                    <strong>{order.reference}</strong>
                    <time dateTime={order.created_at}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </time>
                  </span>
                  <strong>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: order.currency,
                    }).format(Number(order.order_total))}
                  </strong>
                </Link>
              ))}
            </section>

            <button
              type="button"
              className="ngc-account-sheet__signout"
              disabled={signOut.isPending}
              onClick={async () => {
                await signOut.mutateAsync()
                close()
              }}
            >
              <LogOut size={18} aria-hidden="true" />
              {signOut.isPending ? 'Signing out...' : 'Sign out'}
            </button>
          </>
        ) : (
          <div className="ngc-account-sheet__guest">
            <span className="ngc-account-sheet__avatar" aria-hidden="true"><User size={22} /></span>
            <h2>Your account</h2>
            <p>Sign in to check out securely and keep your order history in one place.</p>
            <Link className="ngc-btn ngc-btn--dark" href="/login/" onClick={close}>Sign In</Link>
            <Link className="ngc-btn ngc-btn--outline" href="/signup/" onClick={close}>Create Account</Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
