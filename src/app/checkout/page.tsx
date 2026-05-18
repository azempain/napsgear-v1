'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import {
  validateCheckout, buildOrderPayload, type CheckoutForm,
} from '@/lib/checkout'
import CheckoutFormView from '@/components/CheckoutForm'
import OrderSummary from '@/components/OrderSummary'
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
      <main className="main">
        <div className="container py-5">
          <div className="checkout-confirm text-center py-5">
            <div className="checkout-confirm__check" aria-hidden="true">&#10003;</div>
            <h1 className="mt-3">Order received — thank you!</h1>
            <p className="text-muted">
              We&apos;ve emailed your order to the NapsGear team. You&apos;ll hear
              back at <strong>{form.email}</strong>.
            </p>
            {snapshot.current && (
              <p className="mt-3">
                {snapshot.current.count} item(s) · Total {snapshot.current.total}
              </p>
            )}
            <p className="text-muted mt-4">Redirecting you to the shop…</p>
            <a className="btn btn-dark mt-2" href="/catalog/">Continue shopping now &rarr;</a>
          </div>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="main">
        <div className="container py-5 text-center">
          <h1 className="mb-3">Your cart is empty</h1>
          <a className="btn btn-dark" href="/catalog/">Continue shopping</a>
        </div>
      </main>
    )
  }

  const submitting = status === 'submitting'

  return (
    <main className="main">
      <div className="container py-5">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item"><a href="/cart/">Cart</a></li>
            <li className="breadcrumb-item active" aria-current="page">Checkout</li>
          </ol>
        </nav>
        <h1 className="mb-4">Checkout</h1>
        <div className="row g-4">
          <div className="col-lg-7">
            <CheckoutFormView
              form={form}
              errors={errors}
              disabled={submitting}
              onChange={update}
            />
          </div>
          <div className="col-lg-5">
            <OrderSummary items={items} />
            {status === 'error' && (
              <div className="alert alert-danger mt-3" role="alert">
                Couldn&apos;t submit your order — please try again.
              </div>
            )}
            <button
              type="button"
              className="btn btn-dark w-100 mt-3"
              id="placeOrderBtn"
              disabled={submitting}
              onClick={placeOrder}
            >
              {submitting ? 'Placing order…' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
