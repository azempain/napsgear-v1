import type { CSSProperties } from 'react'
import { ChevronDown } from 'lucide-react'
import { brands, categories } from '@/data'

const Chevron = () => <ChevronDown size={13} strokeWidth={2.5} className="nav-chevron" />

// The megamenu grid flows top-to-bottom by column (grid-auto-flow: column) over
// a fixed 4 columns, so the row count must match the item count or the panel
// overflows / looks sparse. Derive --drm-rows from the data so it stays
// balanced across catalog regenerations instead of a hardcoded CSS value.
const MEGA_COLS = 4
const rowsFor = (count: number): CSSProperties =>
  ({ '--drm-rows': Math.max(1, Math.ceil(count / MEGA_COLS)) } as CSSProperties)

// Optional NEW / PROMO badges, keyed by brand or category slug. The catalog
// data carries no such flags, so they live here as a small curated list. Add a
// slug to flag it in the megamenu; remove it when the promo ends.
const BADGES: Record<string, 'NEW' | 'PROMO'> = {
  // 'driada-medical': 'NEW',
  // 'crowx-labs': 'PROMO',
}

function Badge({ slug }: { slug: string }) {
  const badge = BADGES[slug]
  if (!badge) return null
  return <span className={badge === 'NEW' ? 'badge-new' : 'badge-promo'}>{badge}</span>
}

export default function HeaderNav() {
  return (
    <nav id="mainMenuNav" className="main-nav w-100">
      <ul className="menu">

        {/* ── Brands ── 4-column megamenu */}
        <li className="menu-item menu-item-dropdown with-megamenu dropdown">
          <button type="button" className="dropdown-button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">Brands <Chevron /></button>
          <div className="dropdown-menu">
            <ul className="menu-item__list menu-item__list--brands" style={rowsFor(brands.filter(b => b.slug).length)}>
              {brands.filter(b => b.slug).map(b => (
                <li key={b.slug}>
                  <a className="menu-item__link main-brand" href={`/brands/${b.slug}/`}>
                    {b.name} <Badge slug={b.slug!} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </li>

        {/* ── Categories ── 4-column megamenu */}
        <li className="menu-item menu-item-dropdown with-megamenu dropdown">
          <button type="button" className="dropdown-button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">Categories <Chevron /></button>
          <div className="dropdown-menu">
            <ul className="menu-item__list menu-item__list--categories" style={rowsFor(categories.length)}>
              {categories.map(c => (
                <li key={c.slug}>
                  <a className="menu-item__link main-category" href={`/categories/${c.slug}/`}>
                    {c.name} <Badge slug={c.slug} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </li>

        {/* ── Promotions ── regular dropdown */}
        <li className="menu-item menu-item-dropdown dropdown">
          <button type="button" className="dropdown-button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">Promotions <Chevron /></button>
          <div className="dropdown-menu">
            <a className="menu-item__link" href="/store-credit/">Earn Store Credit</a>
            <a className="menu-item__link" href="/aas-diaries/">NapsGear AAS Diaries <span className="badge-new">NEW</span></a>
            <a className="menu-item__link" href="/affiliate-program/">Affiliate Partner Program</a>
            <a className="menu-item__link" href="/reviews-for-cash/">Reviews for Cash</a>
            <a className="menu-item__link" href="/share-your-gear-pics/">Share Your Gear Pics</a>
            <a className="menu-item__link" href="/refer-a-friend/">Refer NapsGear for Cash</a>
            <a className="menu-item__link" href="/cashback/">Flat 20% Cashback</a>
            <div className="menu-item__title">Products on Sale</div>
            <a className="menu-item__link" href="/supplier-super-deals/">Supplier Super Deals <span className="badge-new">NEW</span></a>
            <a className="menu-item__link" href="/product-of-the-week/">Product of the Week</a>
            <a className="menu-item__link" href="/promotions/">All Recent Promotions</a>
          </div>
        </li>

        {/* ── Info & Entertainment ── regular dropdown */}
        <li className="menu-item menu-item-dropdown dropdown">
          <button type="button" className="dropdown-button" data-bs-toggle="dropdown" data-bs-display="static" aria-expanded="false">Info &amp; Entertainment <Chevron /></button>
          <div className="dropdown-menu">
            <a className="menu-item__link" href="/ask-an-ifbb-pro/">Ask an IFBB Pro Anything</a>
            <a className="menu-item__link" href="/aas-diaries/">NapsGear AAS Diaries</a>
            <a className="menu-item__link" href="/why-naps/">Why Buy from NapsGear</a>
            <a className="menu-item__link" href="/laboratory-tests/">Laboratory Tests</a>
            <a className="menu-item__link" href="/project-get-shredded/">Project Get Shredded</a>
            <a className="menu-item__link" href="/community-gearpics/">Community Gear Pics</a>
            <a className="menu-item__link" href="/qa/">LIVE Q&amp;A Forums</a>
          </div>
        </li>

      </ul>
    </nav>
  )
}
