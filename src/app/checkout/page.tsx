'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import {
  validateCheckout, buildOrderPayload, type CheckoutForm,
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
  const [form, setForm] = useState<CheckoutForm>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('form')
  const snapshot = useRef<{ count: number; total: string } | null>(null)

  // Clear cart + auto-redirect once we reach success.
  useEffect(() => {
    if (status !== 'success') return
    clearCart()
    const t = setTimeout(() => router.push('/catalog/'), 5000)
    return () => clearTimeout(t)
  }, [status, clearCart, router])

  function update(name: keyof CheckoutForm, value: string) {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function placeOrder() {
    const errs = validateCheckout(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      const first = Object.keys(errs)[0]
      document.getElementById(first)?.focus()
      return
    }
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
    }
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: key, ...buildOrderPayload(form, items) }),
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
  }

  // success takes precedence over the empty-cart guard (cart is now empty by design)
  if (status === 'success') {
    return (
      <main className="main cart-main">
        <div className="ngc-confirm" role="status" aria-live="polite">
          <div className="ngc-confirm__check" aria-hidden="true">&#10003;</div>
          <h1 className="ngc-confirm__title">Order received — thank you!</h1>
          <p className="ngc-confirm__sub">
            We&apos;ve emailed your order to the NapsGear team. You&apos;ll hear
            back at <strong>{form.email}</strong>.
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
          <CheckoutFormView
            form={form}
            errors={errors}
            disabled={submitting}
            onChange={update}
          />
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
            onClick={placeOrder}
          >
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </aside>
      </div>
    </main>
  )
}
