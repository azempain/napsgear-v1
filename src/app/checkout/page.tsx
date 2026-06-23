'use client'
import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from '@tanstack/react-form'
import { useStore } from '@tanstack/react-store'
import { useCart } from '@/context/CartContext'
import type { CheckoutForm } from '@/lib/checkout'
import CheckoutFormView from '@/components/CheckoutForm'
import OrderSummary from '@/components/OrderSummary'
import EmptyCart from '@/components/EmptyCart'
import CartSkeleton from '@/components/CartSkeleton'
import { total } from '@/lib/cart'
import { useCurrency } from '@/context/CurrencyContext'
import { useMutation } from '@tanstack/react-query'
import { completeCheckout } from '@/lib/checkoutOrder'
import { createOrderReference } from '@/lib/orderSubmission'
import { useAuthSession } from '@/lib/authSession'
import HCaptcha, { type HCaptchaHandle } from '@/components/HCaptcha'
import { HCAPTCHA_CONFIGURED } from '@/lib/hcaptcha'
import { BTC_PAYMENT_URL, BTC_WALLET_ADDRESS, SUPPORT_EMAIL, buildPaymentHref, buildWhatsAppHref } from '@/lib/storefrontConfig'
import { checkoutDefaultsFromSession, checkoutUiStore } from '@/lib/checkoutUiStore'

export default function CheckoutPage() {
  const { items, hydrated, clearCart } = useCart()
  const { currency, money } = useCurrency()
  const { data: session } = useAuthSession()
  const checkoutUi = useStore(checkoutUiStore)
  const captchaRef = useRef<HCaptchaHandle>(null)
  const whatsappHref = buildWhatsAppHref()

  const orderMutation = useMutation({
    mutationFn: ({ value, accessKey, reference }: { value: CheckoutForm; accessKey: string; reference: string }) =>
      completeCheckout({
        accessKey,
        currency,
        form: value,
        items,
        reference,
        captchaToken: HCAPTCHA_CONFIGURED ? checkoutUiStore.state.captchaToken ?? undefined : undefined,
      }),
  })

  const form = useForm({
    defaultValues: checkoutDefaultsFromSession(null),
    onSubmit: async ({ value }) => {
      // CheckoutForm already wired per-field onBlur+onSubmit validators using
      // checkoutFieldValidators, so by the time we land here the form is valid.
      checkoutUiStore.actions.setFormError('')
      const key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY
      if (!key) {
        console.warn('[checkout] NEXT_PUBLIC_WEB3FORMS_KEY is not set — see .env.local.example')
        checkoutUiStore.actions.setFormError('Checkout email is not configured. Add NEXT_PUBLIC_WEB3FORMS_KEY before taking orders.')
        return
      }
      if (HCAPTCHA_CONFIGURED && !checkoutUiStore.state.captchaToken) {
        checkoutUiStore.actions.setCaptchaError('Please complete the "I am human" check before placing your order.')
        return
      }
      checkoutUiStore.actions.setCaptchaError('')
      const reference = checkoutUiStore.state.reference ?? createOrderReference()
      checkoutUiStore.actions.setReference(reference)
      try {
        const result = await orderMutation.mutateAsync({ value, accessKey: key, reference })
        checkoutUiStore.actions.complete({
          count: items.reduce((sum, item) => sum + item.qty, 0),
          total: money(total(items)),
          email: value.email,
          reference: result.reference,
          persistenceWarning: result.persistenceWarning,
        })
      } catch {
        // hCaptcha tokens are single-use; clear the consumed token and reset
        // the widget so a retry obtains a fresh one instead of replaying it.
        if (HCAPTCHA_CONFIGURED) {
          captchaRef.current?.reset()
          checkoutUiStore.actions.setCaptchaToken(null)
        }
      }
    },
  })

  useEffect(() => {
    checkoutUiStore.actions.reset()
    return () => checkoutUiStore.actions.reset()
  }, [])

  // Clear cart + scroll the success screen into view once we reach success.
  // Without the scroll, users who submit from a long form land below the fold
  // and don't see the payment instructions.
  useEffect(() => {
    if (checkoutUi.status !== 'success') return
    clearCart()
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [checkoutUi.status, clearCart])

  useEffect(() => {
    if (checkoutUi.status !== 'success' || !checkoutUi.snapshot || !BTC_PAYMENT_URL) return
    const href = buildPaymentHref({
      reference: checkoutUi.snapshot.reference,
      total: checkoutUi.snapshot.total,
    })
    if (!href) return
    const t = setTimeout(() => {
      window.location.href = href
    }, 8000)
    return () => clearTimeout(t)
  }, [checkoutUi.status, checkoutUi.snapshot])

  useEffect(() => {
    if (!session) return
    if (!form.getFieldValue('fullName') && session.user.name) {
      form.setFieldValue('fullName', session.user.name)
    }
    if (!form.getFieldValue('email') && session.user.email) {
      form.setFieldValue('email', session.user.email)
    }
  }, [form, session])

  // success takes precedence over the empty-cart guard (cart is now empty by design)
  if (checkoutUi.status === 'success') {
    const snapshot = checkoutUi.snapshot
    return (
      <main className="main cart-main">
        <div className="container">
        <div className="ngc-confirm" role="status" aria-live="polite">
          <div className="ngc-confirm__check" aria-hidden="true">&#10003;</div>
          <h1 className="ngc-confirm__title">Order received — thank you!</h1>
          <p className="ngc-confirm__sub">
            We&apos;ve emailed your order to the NapsGear team. Complete the
            Bitcoin payment next so support can match it to your order.
          </p>
          {snapshot && (
            <>
              <p className="ngc-confirm__meta">
                {snapshot.count} item(s) · Total {snapshot.total}
              </p>
              <p className="ngc-confirm__reference">
                Order reference <strong>{snapshot.reference}</strong>
              </p>
              {snapshot.persistenceWarning && (
                <p className="ngc-confirm__hint">
                  Your order was emailed, but account order history could not be updated. Reference: {snapshot.reference}.
                </p>
              )}
              <section className="ngc-payment-instructions" aria-labelledby="payment-instructions-title">
                <h2 id="payment-instructions-title">Bitcoin payment</h2>
                <dl>
                  <div>
                    <dt>Total</dt>
                    <dd>{snapshot.total}</dd>
                  </div>
                  <div>
                    <dt>Reference</dt>
                    <dd>{snapshot.reference}</dd>
                  </div>
                  {BTC_WALLET_ADDRESS && (
                    <div>
                      <dt>BTC wallet</dt>
                      <dd className="ngc-payment-instructions__wallet">{BTC_WALLET_ADDRESS}</dd>
                    </div>
                  )}
                  {SUPPORT_EMAIL && (
                    <div>
                      <dt>Email</dt>
                      <dd><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></dd>
                    </div>
                  )}
                  {whatsappHref && (
                    <div>
                      <dt>WhatsApp</dt>
                      <dd><a href={whatsappHref} target="_blank" rel="noreferrer">Chat with support</a></dd>
                    </div>
                  )}
                </dl>
                <p>
                  Include your order reference when sending payment details or
                  contacting support.
                </p>
              </section>
            </>
          )}
          {snapshot && BTC_PAYMENT_URL ? (
            <>
              <p className="ngc-confirm__hint">Redirecting to the payment page...</p>
              <a
                className="ngc-btn ngc-btn--dark"
                href={buildPaymentHref({
                  reference: snapshot.reference,
                  total: snapshot.total,
                })}
              >
                Open payment page
              </a>
            </>
          ) : (
            <Link className="ngc-btn ngc-btn--dark" href="/catalog/">Continue shopping now &rarr;</Link>
          )}
        </div>
        </div>
      </main>
    )
  }

  // Pre-hydration: render skeleton tree so the empty-state CTA doesn't flash
  // before localStorage is read.
  if (!hydrated) {
    return (
      <main className="main cart-main">
        <CartSkeleton />
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

  const submitting = orderMutation.isPending

  const grandTotal = money(total(items))

  return (
    <main className="main cart-main">
      <div className="container">
        <nav className="ngc-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="ngc-crumbs__sep" aria-hidden="true">›</span>
          <Link href="/cart/">Cart</Link>
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

          <aside className="ngc-totals ngc-checkout-rail" aria-label="Order summary column">
            <OrderSummary items={items} />
            <div className="ngc-checkout-action-card">
              <HCaptcha
                ref={captchaRef}
                configured={HCAPTCHA_CONFIGURED}
                onVerify={token => checkoutUiStore.actions.setCaptchaToken(token)}
                onExpire={() => checkoutUiStore.actions.setCaptchaToken(null)}
              />
              {checkoutUi.captchaError && (
                <div className="ngc-alert" role="alert">
                  {checkoutUi.captchaError}
                </div>
              )}
              {checkoutUi.formError && (
                <div className="ngc-alert" role="alert">
                  {checkoutUi.formError}
                </div>
              )}
              {orderMutation.isError && (
                <div className="ngc-alert" role="alert">
                  {orderMutation.error instanceof Error
                    ? orderMutation.error.message
                    : 'Couldn&apos;t submit your order. Please try again.'}
                </div>
              )}
              <button
                type="button"
                className="ngc-btn ngc-btn--dark ngc-btn--block d-none d-md-block"
                id="placeOrderBtn"
                disabled={submitting}
                onClick={() => form.handleSubmit()}
              >
                {submitting ? 'Placing order…' : 'Place Order'}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky action bar — mirrors the cart pattern so the Place
          Order button is always reachable without scrolling the long form. */}
      <div className="ngc-cart-mobile-actions d-md-none" role="region" aria-label="Checkout actions">
        <div className="ngc-cart-mobile-actions__total">
          <span>Total</span>
          <strong>{grandTotal}</strong>
        </div>
        <button
          type="button"
          className="ngc-btn ngc-btn--dark"
          disabled={submitting}
          onClick={() => form.handleSubmit()}
        >
          {submitting ? 'Placing…' : 'Place Order'}
        </button>
      </div>
    </main>
  )
}
