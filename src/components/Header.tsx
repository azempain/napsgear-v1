import { Search, ShoppingCart } from 'lucide-react'
import CartBadge from './CartBadge'
import NapsGearLogo from './NapsGearLogo'
import HeaderNav from './HeaderNav'
import MobileMenu from './MobileMenu'
import CurrencyMenu from './CurrencyMenu'
import AccountLink from './AccountLink'
import Link from 'next/link'

const UTILITY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/shipping-information/', label: 'Shipping' },
  { href: '/why-naps/', label: 'Why Naps?' },
  { href: '/contact-us/', label: 'Contact us' },
  { href: '/ask-an-ifbb-pro/', label: 'Ask an IFBB Pro' },
]

export default function Header() {
  return (
    <header id="header" className="header">

      {/* ── HEADER TOP ── white bar with nav links */}
      <div className="header-top">
        <div className="container ngc-header-top-inner">
          <nav className="ngc-utility-nav d-none d-lg-flex" aria-label="Support navigation">
            {UTILITY_LINKS.map(link => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </nav>
          <div className="ngc-header-currency">
            <CurrencyMenu />
          </div>
        </div>
      </div>

      {/* ── HEADER MIDDLE ── blue bar */}
      <div className="header-middle sticky-header mobile-sticky">
        <div className="container">

          <MobileMenu />

          <Link href="/" className="logo" aria-label="NapsGear home">
            <NapsGearLogo />
          </Link>

          <div className="header-search header-search-inline header-search-category w-lg-max pl-3 pr-1 mb-0">
            <Link href="/catalog/" className="header-icon search-toggle header-nav-features-search-show-icon me-0" aria-label="Search">
              <Search size={20} aria-hidden="true" />
            </Link>
            <div className="header-search-form">
              <form role="search" action="/catalog/" method="get" className="kwdsearch">
                <div className="header-search-wrapper">
                  <input
                    className="form-control text-1 bg-white header-search-input"
                    name="q"
                    type="search"
                    minLength={2}
                    placeholder="Search..."
                  />
                  <button type="submit" className="btn-search" aria-label="Submit search">
                    <Search size={18} aria-hidden="true" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="header-actions">
            <AccountLink />
            <Link href="/cart/" className="header-icon header-icon-cart dropdown-arrow cart-toggle" aria-label="Cart">
              <ShoppingCart size={20} aria-hidden="true" />
              <CartBadge />
            </Link>
          </div>

        </div>
      </div>

      {/* ── HEADER BOTTOM ── white nav bar with mega menus */}
      <div className="header-bottom">
        <div className="container">
          <HeaderNav />
        </div>
      </div>

    </header>
  )
}
