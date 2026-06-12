import { Search, ShoppingCart } from 'lucide-react'
import CartBadge from './CartBadge'
import NapsGearLogo from './NapsGearLogo'
import HeaderNav from './HeaderNav'
import MobileMenu from './MobileMenu'
import CurrencyMenu from './CurrencyMenu'
import AccountLink from './AccountLink'

export default function Header() {
  return (
    <header id="header" className="header">

      {/* ── HEADER TOP ── white bar with nav links */}
      <div className="header-top">
        <div className="container">
          <div className="header-right header-dropdowns w-sm-100">
            <div className="header-dropdown dropdown-expanded d-none d-lg-block mr-2">
              <button type="button" className="ngc-header-links-trigger">Links</button>
              <div className="header-menu">
                <ul id="navigationMenu">
                  <li><a href="/">Home</a></li>
                  <li><a href="/faq/">Faq</a></li>
                  <li><a href="/shipping-information/">Shipping</a></li>
                  <li><a href="/why-naps/">Why Naps ?</a></li>
                  <li><a href="/contact-us/">Contact us</a></li>
                  <li><a href="/ask-an-ifbb-pro/">Ask an IFBB Pro</a></li>
                </ul>
              </div>
            </div>
            <span className="separator"></span>
            <CurrencyMenu />
          </div>
        </div>
      </div>

      {/* ── HEADER MIDDLE ── blue bar */}
      <div className="header-middle sticky-header mobile-sticky">
        <div className="container">

          <MobileMenu />

          <a href="/" className="logo" aria-label="NapsGear home">
            <NapsGearLogo />
          </a>

          <div className="header-search header-search-inline header-search-category w-lg-max pl-3 pr-1 mb-0">
            <a href="/catalog/" className="header-icon search-toggle header-nav-features-search-show-icon me-0" aria-label="Search">
              <Search size={20} aria-hidden="true" />
            </a>
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
            <a href="/cart/" className="header-icon header-icon-cart dropdown-arrow cart-toggle" aria-label="Cart">
              <ShoppingCart size={20} aria-hidden="true" />
              <CartBadge />
            </a>
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
