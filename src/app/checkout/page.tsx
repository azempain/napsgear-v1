'use client'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { useCart } from '@/context/CartContext'
import {
  buildOrderPayload, type CheckoutForm,
} from '@/lib/checkout'
import CheckoutFormView from '@/components/CheckoutForm'
import OrderSummary from '@/components/OrderSummary'
import EmptyCart from '@/components/EmptyCart'
import { total } from '@/lib/cart'

const EMPTY: CheckoutForm = {
  fullName: '', email: '', phone: '', address1: '', address2: '',
  city: '', state: '', postalCode: '', country: '', notes: '',
}

type Status = 'form' | 'submitting' | 'success' | 'error'

export default function CheckoutPage() {
  const { items, clearCart } = useCart()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('form')
  // Captured at submit time so the confirmation screen survives clearCart.
  const snapshot = useRef<{ count: number; total: string; email: string } | null>(null)

  const form = useForm({
    defaultValues: EMPTY,
    onSubmit: async ({ value }) => {
      // CheckoutForm already wired per-field onBlur+onSubmit validators using
      // checkoutFieldValidators, so by the time we land here the form is valid.
      const key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY
      if (!key) {
        console.warn('[checkout] NEXT_PUBLIC_WEB3FORMS_KEY is not set — see .env.local.example')
        setStatus('error')
        return
      }
      setStatus('submitting')
      snapshot.current = {
        count: items.reduce((s, i) => s + i.qty, 0),
        total: `$${total(items).toFixed(2)}`,
        email: value.email,
      }
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 15000)
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: key, ...buildOrderPayload(value, items) }),
          signal: ctrl.signal,
        })
        const data = await res.json().catch(() => ({ success: false }))
        if (res.ok && data.success) setStatus('success')
        else setStatus('error')
      } catch {
        setStatus('error')
      } finally {
        clearTimeout(timer)
      }
    },
  })

  // Clear cart + auto-redirect once we reach success.
  useEffect(() => {
    if (status !== 'success') return
    clearCart()
    const t = setTimeout(() => router.push('/catalog/'), 5000)
    return () => clearTimeout(t)
  }, [status, clearCart, router])

  // success takes precedence over the empty-cart guard (cart is now empty by design)
  if (status === 'success') {
    return (
      <main className="main cart-main">
        <div className="ngc-confirm" role="status" aria-live="polite">
          <div className="ngc-confirm__check" aria-hidden="true">&#10003;</div>
          <h1 className="ngc-confirm__title">Order received — thank you!</h1>
          <p className="ngc-confirm__sub">
            We&apos;ve emailed your order to the NapsGear team. You&apos;ll hear
            back at <strong>{snapshot.current?.email}</strong>.
          </p>
          {snapshot.current && (
            <p className="ngc-confirm__meta">
              {snapshot.current.count} item(s) · Total {snapshot.current.total}
            </p>
          )}
          <p className="ngc-confirm__hint">Redirecting you to the shop…</p>
          <a className="ngc-btn ngc-btn--dark" href="/catalog/">Continue shopping now &rarr;</a>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="main cart-main">
        <div className="container py-5">
          <EmptyCart
            heading="Nothing to check out yet"
            sub="Your cart is empty — add a product before placing an order."
            ctaLabel="Browse Catalog"
          />
        </div>
      </main>
    )
  }

  const submitting = status === 'submitting'

  return (
    <main className="main cart-main">
      <nav className="ngc-crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span className="ngc-crumbs__sep" aria-hidden="true">›</span>
        <a href="/cart/">Cart</a>
        <span className="ngc-crumbs__sep" aria-hidden="true">›</span>
        <span>CHECKOUT</span>
      </nav>

      <div className="ngc-page">
        <div className="ngc-content">
          <div className="ngc-head">
            <span>Checkout</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
            <CheckoutFormView form={form} disabled={submitting} />
          </form>
        </div>

        <aside className="ngc-totals" aria-label="Order summary column">
          <OrderSummary items={items} />
          {status === 'error' && (
            <div className="ngc-alert" role="alert">
              Couldn&apos;t submit your order — please try again.
            </div>
          )}
          <button
            type="button"
            className="ngc-btn ngc-btn--dark ngc-btn--block"
            id="placeOrderBtn"
            disabled={submitting}
            onClick={() => form.handleSubmit()}
          >
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </aside>
      </div>
    </main>
  )
}
