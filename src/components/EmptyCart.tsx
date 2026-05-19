// Shared empty-state for the cart and checkout pages. Uses the .ngc- design
// system so both routes feel like the same product instead of two designs.

export interface EmptyCartProps {
  heading?: string
  sub?: string
  ctaLabel?: string
  ctaHref?: string
}

export default function EmptyCart({
  heading = 'Your cart is empty',
  sub = 'Looks like you haven’t added anything yet.',
  ctaLabel = 'Browse Catalog',
  ctaHref = '/catalog/',
}: EmptyCartProps) {
  return (
    <div className="ngc-empty" role="region" aria-label="Empty cart">
      <div className="ngc-empty__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      </div>
      <h2 className="ngc-empty__title">{heading}</h2>
      <p className="ngc-empty__sub">{sub}</p>
      <a className="ngc-btn ngc-btn--dark" href={ctaHref}>{ctaLabel}</a>
    </div>
  )
}
