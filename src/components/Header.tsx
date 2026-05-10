import { Search, User, ShoppingCart, Menu } from 'lucide-react'
import CartBadge from './CartBadge'
import NapsGearLogo from './NapsGearLogo'
import HeaderNav from './HeaderNav'

export default function Header() {
  return (
    <header id="header" className="header">

      {/* ── HEADER TOP ── white bar with nav links */}
      <div className="header-top">
        <div className="container">
          <div className="header-right header-dropdowns w-sm-100">
            <div className="header-dropdown dropdown-expanded d-none d-lg-block mr-2">
              <a href="#">Links</a>
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
            <div className="header-dropdown header-currency">
              <a href="#" role="button" id="dropdownCurrency" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">USD</a>
              <div className="dropdown-menu dropdown-menu-arrow-centered min-width-0" aria-labelledby="dropdownCurrency">
                <a className="dropdown-item" href="/">US Dollar</a>
                <a className="dropdown-item" href="/">Euro</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HEADER MIDDLE ── blue bar */}
      <div className="header-middle sticky-header mobile-sticky">
        <div className="container">

          <button type="button" className="mobile-menu-toggle" aria-label="Open menu">
            <Menu size={22} aria-hidden="true" />
          </button>

          <a href="/" className="logo" aria-label="NapsGear home">
            <NapsGearLogo />
          </a>

          <div className="header-search header-search-inline header-search-category w-lg-max pl-3 pr-1 mb-0">
            <a href="#" className="header-icon search-toggle header-nav-features-search-show-icon me-0" role="button" aria-label="Search">
              <Search size={20} aria-hidden="true" />
            </a>
            <div className="header-search-form">
              <form role="search" action="#" method="get" className="kwdsearch">
                <div className="header-search-wrapper">
                  <input
                    className="form-control text-1 bg-white header-search-input"
                    name="keywords"
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
            <a className="header-icon header-icon-user" href="#loginModal" data-bs-toggle="modal" role="button" aria-label="Sign in">
              <User size={20} aria-hidden="true" />
            </a>
            <a href="#" className="header-icon header-icon-cart dropdown-arrow cart-toggle" aria-label="Cart">
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
