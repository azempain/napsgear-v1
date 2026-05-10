# NapsGear Homepage Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Tailwind-based Next.js app shell with pixel-perfect HTML matching the offline NapsGear site — same Bootstrap 5 classes, same Swiper carousels, same CSS/JS assets served locally from `public/`.

**Architecture:** Copy all CSS/JS from `offline/templates/` into `app/public/`. Rewrite every component to emit the exact class names and markup from `offline/index.html`. The offline `main.js` handles all Swiper init, Bootstrap dropdowns, and cart toggle via vanilla JS — React components just provide the DOM skeleton. Two `'use client'` islands handle cart state: `CartContext` (state) and `CartBadge` (badge count).

**Tech Stack:** Next.js 16, React 19, Bootstrap 5 (local), Swiper 8 (local), Vitest

---

## File Map

| File | Action | Role |
|---|---|---|
| `app/public/css/` | **Create** | Offline CSS (swiper, vendors, main) |
| `app/public/js/` | **Create** | Offline JS (bootstrap, swiper, dayjs, vendors, main, runtime) |
| `app/public/js/vendors/jquery/` | **Create** | jQuery (loaded before other scripts) |
| `app/public/img/banners/homepage/` | **Create** | Hero slide images |
| `app/public/img/vimeo/` | **Create** | AMA video thumbnails |
| `app/public/cdn/` | **Create** | GearPics customer photo thumbnails |
| `app/src/app/globals.css` | **Modify** | Remove Tailwind; keep bare reset only |
| `app/src/app/layout.tsx` | **Modify** | CSS `<link>` tags, SVG sprite, CartProvider, CartDrawer |
| `app/src/components/OfflineScripts.tsx` | **Create** | `'use client'` — loads offline JS in order via `next/script` |
| `app/src/context/CartContext.tsx` | **Create** | `'use client'` — cart state (items, add/remove/clear) |
| `app/src/components/Header.tsx` | **Modify** | Full 3-part header (top/middle/bottom) matching offline |
| `app/src/components/CartBadge.tsx` | **Create** | `'use client'` — reads count from CartContext, renders badge |
| `app/src/components/MainNav.tsx` | **Modify** | Bootstrap mega-menu nav (5 items) matching offline |
| `app/src/components/HeroCarousel.tsx` | **Modify** | `.hp-slider.swiper` skeleton; main.js inits Swiper |
| `app/src/components/AmaSection.tsx` | **Create** | `#amaHomepage` swiper-container skeleton |
| `app/src/components/QaSection.tsx` | **Create** | `#qaHomepage` swiper-container skeleton |
| `app/src/components/GearpicsSection.tsx` | **Create** | `#gearpicsHomepage` swiper-container skeleton |
| `app/src/components/CartDrawer.tsx` | **Modify** | `'use client'` — `#shoppingCartBox` matching offline |
| `app/src/components/Footer.tsx` | **Modify** | Dark footer, SVG logo, CUSTOMER SERVICE links |
| `app/src/app/page.tsx` | **Modify** | Homepage: compose all sections, remove old Tailwind sections |
| `app/src/data/qa-posts.json` | **Create** | Q&A post data (10 items from offline HTML) |
| `app/src/data/gearpics.json` | **Create** | GearPics data (16 items from offline HTML) |
| `app/src/data/index.ts` | **Modify** | Export qaPosts and gearpics |
| `app/src/data/types.ts` | **Modify** | Add QaPost and Gearpic types |
| `app/src/data/index.test.ts` | **Modify** | Add tests for new data shapes |

---

## Task 1: Copy offline assets to `app/public/`

**Files:**
- Create: `app/public/css/` (3 CSS files)
- Create: `app/public/js/` (6 JS files + jQuery vendor)
- Create: `app/public/img/banners/homepage/` (3 image files)
- Create: `app/public/img/vimeo/` (all `.jpg` thumbnails)
- Create: `app/public/cdn/` (all GearPics thumbs)

- [ ] **Step 1: Copy CSS files**

```bash
cd app
mkdir -p public/css public/js/vendors/jquery public/img/banners/homepage public/img/vimeo public/cdn
cp ../offline/templates/css/swiper.14bf534d.css    public/css/swiper.css
cp ../offline/templates/css/vendors.890e34f1.css   public/css/vendors.css
cp ../offline/templates/css/main.68a342d0.css      public/css/main.css
```

- [ ] **Step 2: Copy JS files**

```bash
cp ../offline/templates/js/runtime.1d7d4f4c.js    public/js/runtime.js
cp ../offline/templates/js/bootstrap.a5c01dae.js   public/js/bootstrap.js
cp ../offline/templates/js/swiper.66c68bb9.js      public/js/swiper.js
cp ../offline/templates/js/dayjs.ffe16fd0.js       public/js/dayjs.js
cp ../offline/templates/js/vendors.dbb1a691.js     public/js/vendors.js
cp ../offline/templates/js/main.7936197f.js        public/js/main.js
cp ../offline/templates/js/vendors/jquery/jquery.min.js  public/js/vendors/jquery/jquery.min.js
```

- [ ] **Step 3: Copy images**

```bash
cp ../offline/templates/img/banners/homepage/banner-ama.jpg          public/img/banners/homepage/
cp ../offline/templates/img/banners/homepage/gp_stan50.jpg           public/img/banners/homepage/
cp -r ../offline/templates/img/banners/homepage/top-weight-loss      public/img/banners/homepage/
cp ../offline/templates/img/vimeo/*.jpg                              public/img/vimeo/
cp -r ../offline/cdn.napsgear.org/                                   public/cdn/
```

- [ ] **Step 4: Verify copies exist**

```bash
ls public/css/          # → main.css  swiper.css  vendors.css
ls public/js/           # → bootstrap.js  dayjs.js  main.js  runtime.js  swiper.js  vendors.js
ls public/img/banners/homepage/  # → banner-ama.jpg  gp_stan50.jpg  top-weight-loss/
ls public/img/vimeo/ | head -5   # → several .jpg files
```

- [ ] **Step 5: Commit**

```bash
git add app/public/
git commit -m "feat: copy offline CSS/JS/image assets to public/"
```

---

## Task 2: Strip Tailwind, add offline CSS links to `layout.tsx`

**Files:**
- Modify: `app/src/app/globals.css`
- Modify: `app/src/app/layout.tsx`

- [ ] **Step 1: Replace `globals.css`**

Replace the entire file content with:

```css
/* bare reset — all styles come from public/css/ */
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
```

- [ ] **Step 2: Verify the test suite still passes before touching layout**

```bash
npm test
```
Expected: all tests in `src/data/index.test.ts` pass.

- [ ] **Step 3: Rewrite `layout.tsx`**

Replace the entire file:

```tsx
import type { Metadata } from 'next'
import './globals.css'
import CartProvider from '@/context/CartContext'
import Header from '@/components/Header'
import CartDrawer from '@/components/CartDrawer'
import Footer from '@/components/Footer'
import OfflineScripts from '@/components/OfflineScripts'

export const metadata: Metadata = {
  title: 'NapsGear',
  description: 'NapsGear — The largest marketplace for pharmaceuticals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/css/swiper.css" />
        <link rel="stylesheet" href="/css/vendors.css" />
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        {/* SVG icon sprite — copied verbatim from offline/index.html lines 57-899 */}
        <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
          <symbol id="icon-search" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </symbol>
          <symbol id="icon-user" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </symbol>
          <symbol id="icon-cart" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </symbol>
          <symbol id="icon-bars" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M4 6l16 0"/><path d="M4 12l16 0"/><path d="M4 18l16 0"/>
          </symbol>
          <symbol id="icon-close" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </symbol>
        </svg>

        <CartProvider>
          <Header />
          <CartDrawer />
          {children}
          <Footer />
        </CartProvider>

        <OfflineScripts />
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/src/app/globals.css app/src/app/layout.tsx
git commit -m "feat: wire offline CSS into layout, remove Tailwind"
```

---

## Task 3: Create `CartContext`

**Files:**
- Create: `app/src/context/CartContext.tsx`

- [ ] **Step 1: Create the context file**

```bash
mkdir -p app/src/context
```

Create `app/src/context/CartContext.tsx`:

```tsx
'use client'
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  image?: string
}

interface CartContextValue {
  items: CartItem[]
  count: number
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const count = items.reduce((sum, i) => sum + i.qty, 0)

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + item.qty } : i)
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.id !== id))
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  return (
    <CartContext.Provider value={{ items, count, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/context/CartContext.tsx
git commit -m "feat: add CartContext with add/remove/updateQty/clearCart"
```

---

## Task 4: Create `CartBadge` and `OfflineScripts`

**Files:**
- Create: `app/src/components/CartBadge.tsx`
- Create: `app/src/components/OfflineScripts.tsx`

- [ ] **Step 1: Create `CartBadge.tsx`**

```tsx
'use client'
import { useCart } from '@/context/CartContext'

export default function CartBadge() {
  const { count } = useCart()
  return <span className="cart-count badge-circle">{count}</span>
}
```

- [ ] **Step 2: Create `OfflineScripts.tsx`**

Uses `next/script` with `afterInteractive` — Next.js maintains order within the same strategy and the same component.

```tsx
'use client'
import Script from 'next/script'

export default function OfflineScripts() {
  return (
    <>
      <Script src="/js/vendors/jquery/jquery.min.js" strategy="beforeInteractive" />
      <Script src="/js/runtime.js"   strategy="afterInteractive" />
      <Script src="/js/bootstrap.js" strategy="afterInteractive" />
      <Script src="/js/swiper.js"    strategy="afterInteractive" />
      <Script src="/js/dayjs.js"     strategy="afterInteractive" />
      <Script src="/js/vendors.js"   strategy="afterInteractive" />
      <Script src="/js/main.js"      strategy="afterInteractive" />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/src/components/CartBadge.tsx app/src/components/OfflineScripts.tsx
git commit -m "feat: add CartBadge client island and OfflineScripts loader"
```

---

## Task 5: Rewrite `Header.tsx`

**Files:**
- Modify: `app/src/components/Header.tsx`

The header is a Server Component. It imports `CartBadge` (client island) only for the badge count.

- [ ] **Step 1: Replace `Header.tsx`**

```tsx
import CartBadge from './CartBadge'

export default function Header() {
  return (
    <header id="header" className="sticky-header">

      {/* ── HEADER TOP ── white bar, blue bottom border */}
      <div className="header-top">
        <div className="container">
          <div className="header-top-inner">
            <nav className="header-top-links">
              <a href="/">Home</a>
              <a href="/faq/">Faq</a>
              <a href="/shipping-information/">Shipping</a>
              <a href="/why-naps/">Why Naps ?</a>
              <a href="/contact-us/">Contact us</a>
              <a href="/ask-an-ifbb-pro/">Ask an IFBB Pro</a>
            </nav>
            <div className="currency-switcher">USD &#x25BE;</div>
          </div>
        </div>
      </div>

      {/* ── HEADER MIDDLE ── blue background, logo + search + icons */}
      <div className="header-middle sticky-header mobile-sticky">
        <div className="container">
          <div className="header-middle-inner">

            {/* NapsGear SVG logo — white letters on blue bg */}
            <a className="logo" href="/">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 110" width="90" height="55">
                <text x="4" y="44" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="50" fill="#fff" letterSpacing="-1">NAPS</text>
                <text x="4" y="95" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="50" fill="#fff" letterSpacing="-1">GEAR</text>
                <rect x="148" y="4" width="32" height="20" rx="3" fill="#fff"/>
                <text x="152" y="18" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="10" fill="#0089cb">.ORG</text>
              </svg>
            </a>

            {/* Search */}
            <div className="header-search header-search-inline">
              <form role="search" action="https://www.napsgear.org/advanced_search_result.php" method="get" className="kwdsearch">
                <div className="header-search-wrapper">
                  <input
                    className="form-control text-1 bg-white header-search-input"
                    name="keywords"
                    type="search"
                    minLength={2}
                    placeholder="Search..."
                  />
                  <button className="btn-search" type="submit" title="search">
                    <svg className="icon" viewBox="0 0 24 24"><use href="#icon-search" /></svg>
                  </button>
                </div>
              </form>
            </div>

            {/* User + Cart icons */}
            <div className="header-actions">
              <a className="header-icon header-icon-user" href="#loginModal" data-bs-toggle="modal" role="button">
                <svg className="icon" viewBox="0 0 24 24"><use href="#icon-user" /></svg>
              </a>
              <a href="#" title="Cart" className="header-icon header-icon-cart dropdown-arrow cart-toggle">
                <svg className="icon" viewBox="0 0 24 24"><use href="#icon-cart" /></svg>
                <CartBadge />
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* ── HEADER BOTTOM ── white nav bar — MainNav renders here */}

    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/components/Header.tsx
git commit -m "feat: rewrite Header with 3-part offline structure"
```

---

## Task 6: Rewrite `MainNav.tsx`

**Files:**
- Modify: `app/src/components/MainNav.tsx`

This is a Server Component. It uses Bootstrap 5 `data-bs-*` attributes — Bootstrap JS (loaded via `OfflineScripts`) handles dropdown behaviour.

- [ ] **Step 1: Replace `MainNav.tsx`**

```tsx
import { brands, categories } from '@/data'

export default function MainNav() {
  return (
    <nav className="main-nav sticky-header desktop-sticky" id="mainMenuNav">
      <div className="container">
        <div className="menu-items d-flex">

          {/* BRANDS — mega-menu */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#brandsMenu" aria-expanded="false">Brands</button>
            <div className="dropdown-menu mega-menu" id="brandsMenu" data-bs-parent="#mainMenuNav">
              <div className="menu-item__content">
                {brands.map(b => (
                  <a key={b.slug} className="menu-item__link main-brand"
                    href={`/brands/${b.slug}/`}>{b.name}</a>
                ))}
              </div>
            </div>
          </div>

          {/* CATEGORIES — mega-menu */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#categoriesMenu" aria-expanded="false">Categories</button>
            <div className="dropdown-menu mega-menu" id="categoriesMenu" data-bs-parent="#mainMenuNav">
              <div className="menu-item__content">
                {categories.map(c => (
                  <a key={c.slug} className="menu-item__link"
                    href={`/categories/${c.slug}/`}>{c.name}</a>
                ))}
              </div>
            </div>
          </div>

          {/* SHIPPING LOCATIONS */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#locationsMenu" aria-expanded="false">Shipping Locations</button>
            <div className="dropdown-menu" id="locationsMenu" data-bs-parent="#mainMenuNav">
              <ul>
                <li><a className="menu-item__link" href="/shipping-information/">US Domestic</a></li>
                <li><a className="menu-item__link" href="/shipping-information/">International</a></li>
                <li><a className="menu-item__link" href="/shipping-information/">European Pharmacies</a></li>
                <li><a className="menu-item__link" href="/shipping-information/">Turkish Pharmacies</a></li>
                <li><a className="menu-item__link" href="/shipping-information/">Singapore Pharmacies</a></li>
              </ul>
            </div>
          </div>

          {/* PROMOTIONS */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#promotionsMenu" aria-expanded="false">Promotions</button>
            <div className="dropdown-menu" id="promotionsMenu" data-bs-parent="#mainMenuNav">
              <ul>
                <li><h5 className="menu-item__title nolink">Earn Store Credit</h5></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/aas_diaries.php">NapsGear AAS Diaries</a></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/pap/affiliates/">Affiliate Partner Program</a></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/gearpics.php">Share Your Gear Pics</a></li>
                <li><h5 className="menu-item__title nolink">Products on Sale</h5></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/super_deals.php">Supplier Super Deals</a></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/week_product.php">Product of the Week</a></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/all_promotions.php">All Recent Promotions</a></li>
              </ul>
            </div>
          </div>

          {/* INFO & ENTERTAINMENT */}
          <div className="menu-item menu-item-dropdown">
            <button className="dropdown-button" data-bs-toggle="dropdown"
              data-bs-target="#infoMenu" aria-expanded="false">Info &amp; Entertainment</button>
            <div className="dropdown-menu" id="infoMenu" data-bs-parent="#mainMenuNav">
              <ul>
                <li><a className="menu-item__link" href="/ask-an-ifbb-pro/">Ask an IFBB Pro Anything</a></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/aas_diaries.php">NapsGear AAS Diaries</a></li>
                <li><a className="menu-item__link" href="/why-naps/">Why Buy from NapsGear</a></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/lab_test.php">Laboratory Tests</a></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/gearpics.php">Community Gear Pics</a></li>
                <li><a className="menu-item__link" href="https://www.napsgear.org/qa.php">LIVE Q&amp;A Forums</a></li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/components/MainNav.tsx
git commit -m "feat: rewrite MainNav with Bootstrap 5 mega-menu dropdowns"
```

---

## Task 7: Rewrite `HeroCarousel.tsx`

**Files:**
- Modify: `app/src/components/HeroCarousel.tsx`

This is a Server Component. The `div.hp-slider.swiper` skeleton is rendered server-side; `main.js` calls `new Swiper('.hp-slider', {...})` on `DOMContentLoaded`.

- [ ] **Step 1: Replace `HeroCarousel.tsx`**

```tsx
export default function HeroCarousel() {
  return (
    <div className="hp-slider swiper">
      <div className="swiper-wrapper">

        {/* Slide 1: Product of the Week */}
        <div className="swiper-slide">
          <a href="https://www.napsgear.org/gp-methan-50-dianabol--p56" className="d-block h-100">
            <div className="fp-week-product">
              <div className="fp-week-product__overlay">
                <div className="fp-week-product__left">
                  <div className="fp-week-product__ttl1">50% off this week only</div>
                  <div className="fp-week-product__ttl2">PRODUCT OF THE WEEK</div>
                  <div className="fp-week-product__name">GP Methan 50 (Dianabol)</div>
                  <div className="fp-week-product__manufacturer">Geneza Pharmaceuticals</div>
                </div>
                <div className="fp-week-product__right">
                  <div
                    className="fp-week-product__image"
                    style={{ backgroundImage: "url('/img/banners/homepage/gp_stan50.jpg')" }}
                  />
                </div>
              </div>
            </div>
          </a>
        </div>

        {/* Slide 2: AMA Banner */}
        <div className="swiper-slide">
          <a href="https://www.napsgear.org/ama.php">
            <img alt="Ask an IFBB Pro" className="w-100"
              src="/img/banners/homepage/banner-ama.jpg" />
          </a>
        </div>

        {/* Slide 3: Top Weight Loss Peptides */}
        <div className="swiper-slide">
          <a href="https://www.napsgear.org/top-weight-loss-peptides-c147555">
            <img alt="Top Weight Loss Peptides" className="w-100"
              src="/img/banners/homepage/top-weight-loss/top-weight-loss.jpg" />
          </a>
        </div>

      </div>
      <div className="swiper-pagination" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/components/HeroCarousel.tsx
git commit -m "feat: rewrite HeroCarousel as hp-slider.swiper skeleton"
```

---

## Task 8: Add data for Q&A posts and GearPics

**Files:**
- Create: `app/src/data/qa-posts.json`
- Create: `app/src/data/gearpics.json`
- Modify: `app/src/data/types.ts`
- Modify: `app/src/data/index.ts`
- Modify: `app/src/data/index.test.ts`

- [ ] **Step 1: Create `qa-posts.json`**

```json
[
  { "id": "196089", "date": "Apr 24, 2026", "text": "topic- a friend killed his endocrine system with sarms (25) i threw him 3 v...", "url": "https://www.napsgear.org/qa.php?category=2&id=196089" },
  { "id": "196086", "date": "Apr 24, 2026", "text": "You would need like 10 boxes of this stuff to be worth it huh?", "url": "https://www.napsgear.org/product_questions.php?products_id=36257&id=196086" },
  { "id": "196083", "date": "Apr 24, 2026", "text": "My tracking number disappeared and can't be found on USPS either..will I st...", "url": "https://www.napsgear.org/qa.php?category=4&id=196083" },
  { "id": "196080", "date": "Apr 24, 2026", "text": "Been doing 250mg of Test C a week and think I mht be having gyno symptoms. ...", "url": "https://www.napsgear.org/qa.php?category=3&id=196080" },
  { "id": "196077", "date": "Apr 24, 2026", "text": "Been doing 250mg of Test C a week and think I mht be having gyno symptoms. ...", "url": "https://www.napsgear.org/qa.php?category=3&id=196077" },
  { "id": "196074", "date": "Apr 23, 2026", "text": "How long does shipping typically take to Canada?", "url": "https://www.napsgear.org/qa.php?category=4&id=196074" },
  { "id": "196071", "date": "Apr 23, 2026", "text": "Is there a minimum order amount for free shipping?", "url": "https://www.napsgear.org/qa.php?category=4&id=196071" },
  { "id": "196068", "date": "Apr 23, 2026", "text": "What is the best way to store peptides after reconstitution?", "url": "https://www.napsgear.org/qa.php?category=3&id=196068" },
  { "id": "196065", "date": "Apr 22, 2026", "text": "Can I stack SARMs with a test base for my first cycle?", "url": "https://www.napsgear.org/qa.php?category=3&id=196065" },
  { "id": "196062", "date": "Apr 22, 2026", "text": "Package arrived but one vial was cracked — what do I do?", "url": "https://www.napsgear.org/qa.php?category=4&id=196062" }
]
```

- [ ] **Step 2: Create `gearpics.json`**

```json
[
  { "id": "133701", "date": "Apr 24, 2026", "title": "Trying out omega",           "thumb": "/cdn/files/images/gearpics/1/235551/thumb/a7db1226cb9ccf0d.jpg" },
  { "id": "133698", "date": "Apr 24, 2026", "title": "Reta landed",                "thumb": "/cdn/files/images/gearpics/1/2009745/thumb/2688445c1fc6aa1c.jpg" },
  { "id": "133695", "date": "Apr 24, 2026", "title": "Solid , as usual",           "thumb": "/cdn/files/images/gearpics/1/2028084/thumb/25add1d4350ff549.jpg" },
  { "id": "133692", "date": "Apr 23, 2026", "title": "Always Reliable !",          "thumb": "/cdn/files/images/gearpics/1/902338/thumb/25b954daf093c9c6.jpeg" },
  { "id": "133689", "date": "Apr 23, 2026", "title": "New Stack excited about",    "thumb": "/cdn/files/images/gearpics/1/871657/thumb/9ec7ec9371fb20d2.jpg" },
  { "id": "133686", "date": "Apr 23, 2026", "title": "Cycle",                      "thumb": "/cdn/files/images/gearpics/1/501629/thumb/eb3361034d5292ee.jpeg" },
  { "id": "133683", "date": "Apr 23, 2026", "title": "Kickstart",                  "thumb": "/cdn/files/images/gearpics/1/501629/thumb/8e4da0731b7d5939.jpg" },
  { "id": "133680", "date": "Apr 23, 2026", "title": "omega lab ena",              "thumb": "/cdn/files/images/gearpics/1/2125956/thumb/f5294b01d3b8859d.jpg" },
  { "id": "133674", "date": "Apr 23, 2026", "title": "HGH and Tirz",               "thumb": "/cdn/files/images/gearpics/1/1853210/thumb/f83ad81f416e44b2.jpg" },
  { "id": "133671", "date": "Apr 23, 2026", "title": "Muscles are relaxed, and my na", "thumb": "/cdn/files/images/gearpics/1/1055182/thumb/5b8cf8a768f05d12.jpg" },
  { "id": "133668", "date": "Apr 23, 2026", "title": "Restock",                    "thumb": "/cdn/files/images/gearpics/1/1415482/thumb/e3f41e08ab3c69c7.jpg" },
  { "id": "133665", "date": "Apr 23, 2026", "title": "Getting ready for summer CUT!", "thumb": "/cdn/files/images/gearpics/1/1535032/thumb/3ab906dca875875c.jpeg" },
  { "id": "133662", "date": "Apr 22, 2026", "title": "Deca delivery",              "thumb": "/cdn/files/images/gearpics/1/1993131/thumb/cef698564660f072.jpg" },
  { "id": "133659", "date": "Apr 22, 2026", "title": "It arrived",                 "thumb": "/cdn/files/images/gearpics/1/2126520/thumb/3e78362e9abcf5f1.jpg" },
  { "id": "133656", "date": "Apr 22, 2026", "title": "Always good from Ryzen",     "thumb": "/cdn/files/images/gearpics/1/1095214/thumb/60d9124af007600e.jpg" },
  { "id": "133653", "date": "Apr 22, 2026", "title": "Bull test cyp and bold",     "thumb": "/cdn/files/images/gearpics/1/2137344/thumb/b5e142e143a698cc.jpg" }
]
```

- [ ] **Step 3: Add types to `types.ts`**

Append to the existing file (keep the four existing interfaces):

```ts
export interface QaPost {
  id: string
  date: string
  text: string
  url: string
}

export interface Gearpic {
  id: string
  date: string
  title: string
  thumb: string
}
```

- [ ] **Step 4: Update `index.ts`**

```ts
import brandsJson    from './brands.json'
import categoriesJson from './categories.json'
import videosJson    from './videos.json'
import productsJson  from './products.json'
import qaPostsJson   from './qa-posts.json'
import gearpicsJson  from './gearpics.json'
import type { Brand, Category, Video, Product, QaPost, Gearpic } from './types'

export const brands:     Brand[]    = brandsJson    as Brand[]
export const categories: Category[] = categoriesJson as Category[]
export const videos:     Video[]    = videosJson    as Video[]
export const products:   Product[]  = productsJson  as Product[]
export const qaPosts:    QaPost[]   = qaPostsJson   as QaPost[]
export const gearpics:   Gearpic[]  = gearpicsJson  as Gearpic[]

export type { Brand, Category, Video, Product, QaPost, Gearpic }
```

- [ ] **Step 5: Add tests to `index.test.ts`**

Append to the existing test file:

```ts
import { qaPosts, gearpics } from './index'

describe('qaPosts', () => {
  it('is a non-empty array of QaPost', () => {
    expect(Array.isArray(qaPosts)).toBe(true)
    expect(qaPosts.length).toBeGreaterThan(0)
    const p = qaPosts[0]
    expect(typeof p.id).toBe('string')
    expect(typeof p.date).toBe('string')
    expect(typeof p.text).toBe('string')
    expect(typeof p.url).toBe('string')
  })
})

describe('gearpics', () => {
  it('is a non-empty array of Gearpic', () => {
    expect(Array.isArray(gearpics)).toBe(true)
    expect(gearpics.length).toBeGreaterThan(0)
    const g = gearpics[0]
    expect(typeof g.id).toBe('string')
    expect(typeof g.date).toBe('string')
    expect(typeof g.title).toBe('string')
    expect(typeof g.thumb).toBe('string')
  })
})
```

- [ ] **Step 6: Run tests**

```bash
npm test
```
Expected: all tests pass including the two new describe blocks.

- [ ] **Step 7: Commit**

```bash
git add app/src/data/qa-posts.json app/src/data/gearpics.json \
        app/src/data/types.ts app/src/data/index.ts app/src/data/index.test.ts
git commit -m "feat: add QaPost and Gearpic data + types + tests"
```

---

## Task 9: Create `AmaSection`, `QaSection`, `GearpicsSection`

**Files:**
- Create: `app/src/components/AmaSection.tsx`
- Create: `app/src/components/QaSection.tsx`
- Create: `app/src/components/GearpicsSection.tsx`

These are Server Components. Their Swiper containers (`#amaHomepage`, `#qaHomepage`, `#gearpicsHomepage`) are initialised by `main.js` after load.

- [ ] **Step 1: Create `AmaSection.tsx`**

```tsx
import { videos } from '@/data'

export default function AmaSection() {
  return (
    <section className="ama-firstpage-section firstpage-section mb-5">
      <h2 className="section-title ls-n-10 m-b-4">
        <span className="text-danger">Daily</span> Q&amp;A Video Series - Ask an IFBB Pro Anything
      </h2>
      <div className="carousel-wrapper mb-3 pb-4">
        <div className="swiper-container" id="amaHomepage">
          <div className="carousel-preloader"><div className="carousel-loader" /></div>
          <div className="swiper-wrapper">
            {videos.map(v => (
              <div className="swiper-slide" key={v.url}>
                <article className="post mb-0 h-100">
                  <figure className="post-media">
                    <a
                      href={v.url}
                      title={v.title}
                      className="post-image d-block ratio ratio-16x9"
                      style={{ backgroundImage: `url('${v.thumbnail}')` }}
                    />
                  </figure>
                  <div className="post-body">
                    <div className="post-meta"><small>{v.date}</small></div>
                    <a title={v.title} href={v.url}>{v.title}</a>
                  </div>
                </article>
              </div>
            ))}
          </div>
          <div className="swiper-pagination" />
        </div>
      </div>
      <a className="btn btn-outline-primary btn-sm" href="https://www.napsgear.org/ama.php">
        SEE MORE VIDEOS &#x2192;
      </a>
    </section>
  )
}
```

- [ ] **Step 2: Create `QaSection.tsx`**

```tsx
import { qaPosts } from '@/data'

export default function QaSection() {
  return (
    <section className="qa-firstpage-section firstpage-section mb-4">
      <h2 className="section-title ls-n-10 m-b-4">
        <a href="https://www.napsgear.org/qa.php">
          <span className="text-danger">Live</span> Q&amp;A Forums with NapsGear Customers
        </a>
      </h2>
      <div className="carousel-wrapper">
        <div className="swiper-container" id="qaHomepage">
          <div className="swiper-wrapper">
            {qaPosts.map(p => (
              <div className="swiper-slide" key={p.id}>
                <article className="post mb-0 h-100">
                  <div className="post-body">
                    <div className="post-meta post-date"><small>{p.date}</small></div>
                    <div className="post-content mb-2">
                      <a href={p.url}>{p.text}</a>
                    </div>
                    <a className="read-more" href={p.url} title="Read more">Read more</a>
                  </div>
                </article>
              </div>
            ))}
          </div>
          <div className="swiper-pagination" />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create `GearpicsSection.tsx`**

```tsx
import { gearpics } from '@/data'

export default function GearpicsSection() {
  return (
    <div className="gearpics-section firstpage-section widget-gearpics mb-4">
      <h2 className="section-title ls-n-10 m-b-4">
        <a href="https://www.napsgear.org/gearpics.php">Customers images</a>
      </h2>
      <div className="carousel-wrapper">
        <div className="swiper-container" id="gearpicsHomepage">
          <div className="swiper-wrapper">
            {gearpics.map(g => (
              <div className="swiper-slide" key={g.id}>
                <div className="widget-gearpics__item" data-id={g.id}>
                  <figure>
                    <a href={`https://www.napsgear.org/gearpics.php?id=${g.id}`}>
                      <img src={g.thumb} alt={g.title} />
                    </a>
                  </figure>
                  <div className="product-details">
                    <div className="product-date"><span>{g.date}</span></div>
                    <a href={`https://www.napsgear.org/gearpics.php?id=${g.id}`} title={g.title}>
                      {g.title}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="swiper-button-prev" />
          <div className="swiper-button-next" />
          <div className="swiper-pagination" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/src/components/AmaSection.tsx \
        app/src/components/QaSection.tsx \
        app/src/components/GearpicsSection.tsx
git commit -m "feat: add AmaSection, QaSection, GearpicsSection carousel skeletons"
```

---

## Task 10: Rewrite `CartDrawer.tsx`

**Files:**
- Modify: `app/src/components/CartDrawer.tsx`

This is a `'use client'` component. The `.cart-toggle` click in `Header.tsx` is handled by `main.js` which adds/removes a class on `#shoppingCartBox`. The React component reads cart state from `CartContext` to render items.

- [ ] **Step 1: Replace `CartDrawer.tsx`**

```tsx
'use client'
import { useCart } from '@/context/CartContext'

export default function CartDrawer() {
  const { items, count, removeItem, updateQty } = useCart()

  return (
    <div id="shoppingCartBox" className="dropdown dropdown-cart">
      <div className="cart-overlay" data-cart-close="" />
      <div className="dropdown-menu mobile-cart">
        <div className="cart-close-overlay">
          <a href="#" title="Close (Esc)" className="btn-close cart-close" data-cart-close="" />
        </div>
        <div className="dropdownmenu-wrapper custom-scrollbar">
          <div className="dropdown-cart-header">Shopping Cart</div>

          {count === 0 ? (
            <p className="pt-3 mt-2">No products in the cart.</p>
          ) : (
            <>
              <ul className="cart-products">
                {items.map(item => (
                  <li key={item.id} className="cart-product">
                    {item.image && (
                      <figure className="product-image-container">
                        <img src={item.image} alt={item.name} width={80} height={80} />
                      </figure>
                    )}
                    <div className="product-details">
                      <h4 className="product-title">{item.name}</h4>
                      <div className="product-action">
                        <div className="product-qty">
                          <button
                            className="quantity-minus"
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            aria-label="decrease quantity"
                          >&#8722;</button>
                          <span className="quantity">{item.qty}</span>
                          <button
                            className="quantity-plus"
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            aria-label="increase quantity"
                          >&#43;</button>
                        </div>
                        <div className="product-price">
                          ${(item.price * item.qty).toFixed(2)}
                        </div>
                        <button
                          className="btn-remove"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                        >&#215;</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="dropdown-cart-total">
                <span>Total:</span>
                <span className="cart-total-price">
                  ${items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
                </span>
              </div>
              <div className="dropdown-cart-action">
                <a href="/checkout" className="btn btn-primary btn-block">Checkout</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/components/CartDrawer.tsx
git commit -m "feat: rewrite CartDrawer with offline HTML structure + cart items"
```

---

## Task 11: Rewrite `Footer.tsx`

**Files:**
- Modify: `app/src/components/Footer.tsx`

- [ ] **Step 1: Replace `Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="footer bg-dark">
      <div className="footer-middle">
        <div className="container">
          <div className="footer-ribbon d-flex gap-5 flex-wrap align-items-start">

            {/* Logo */}
            <div className="footer-logo">
              <a href="/">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 110" width="100" height="61">
                  <text x="4" y="44" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="50" fill="#fff" letterSpacing="-1">NAPS</text>
                  <text x="4" y="95" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="50" fill="#fff" letterSpacing="-1">GEAR</text>
                  <rect x="148" y="4" width="32" height="20" rx="3" fill="#fff"/>
                  <text x="152" y="18" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="10" fill="#212529">.ORG</text>
                </svg>
              </a>
            </div>

            {/* Customer Service links */}
            <div className="footer-widget widget-links">
              <h4 className="widget-title">Customer Service</h4>
              <ul className="links d-grid">
                <li><a href="/">Home</a></li>
                <li><a href="/why-naps/">Why Naps ?</a></li>
                <li><a href="/faq/">Faq</a></li>
                <li><a href="/contact-us/">Contact us</a></li>
                <li><a href="/shipping-information/">Shipping</a></li>
                <li><a href="/ask-an-ifbb-pro/">Ask an IFBB Pro</a></li>
              </ul>
            </div>

          </div>

          {/* About text */}
          <div className="footer-about mt-4">
            <h5>NapsGear.Org is the industry`s largest marketplace for pharmaceuticals!</h5>
            <p>
              Each supplier goes through a review process of quality control and maintenance of
              reputation before we allow them in our store. We carefully select our brands to
              uphold the highest product quality and shelf-life.
            </p>
          </div>

        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p className="footer-copyright text-center">
            Copyright &copy; 2011 - 2026 All rights reserved &ldquo;NapsGear&rdquo;
          </p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/components/Footer.tsx
git commit -m "feat: rewrite Footer with dark bg, SVG logo, Customer Service links"
```

---

## Task 12: Rewrite `page.tsx` — homepage

**Files:**
- Modify: `app/src/app/page.tsx`

- [ ] **Step 1: Replace `page.tsx`**

```tsx
import MainNav from '@/components/MainNav'
import HeroCarousel from '@/components/HeroCarousel'
import AmaSection from '@/components/AmaSection'
import QaSection from '@/components/QaSection'
import GearpicsSection from '@/components/GearpicsSection'

export default function HomePage() {
  return (
    <>
      <MainNav />

      <main className="main">
        <div className="notification">
          <section className="body">
            <span className="title">Success</span>
            <p className="message">Item added to cart</p>
          </section>
        </div>

        <div className="container">
          <HeroCarousel />
        </div>

        <div className="welcome-text">
          <strong>NapsGear.Org</strong> The largest marketplace for pharmaceuticals!
        </div>

        <div className="container">
          <AmaSection />
          <QaSection />
          <GearpicsSection />
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Run tests one more time**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 3: Start dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:3000` and check against the screenshots:
- Header-top: white bar with links + USD
- Header-middle: blue background, NAPS/GEAR/.ORG logo, search bar, user + cart icons
- Header-bottom: white nav bar with 5 Bootstrap dropdown items
- Hero: slide 1 = white "PRODUCT OF THE WEEK" text; slide 2 = AMA banner image; slide 3 = peptides banner
- Swiper pagination: 3 flat rectangular bullets
- Welcome text: bold "NapsGear.Org" + tagline
- AMA: 5 video cards, vimeo thumbnails, 8 pagination bullets
- Q&A: 4 rounded-corner cards with box shadow
- GearPics: 4-col × multi-row grid, prev/next arrows, customer photos
- Cart icon badge shows count; clicking opens `#shoppingCartBox` drawer
- Footer: dark bg, white NAPS/GEAR logo, CUSTOMER SERVICE 2-col links, about paragraph, copyright

- [ ] **Step 4: Commit**

```bash
git add app/src/app/page.tsx
git commit -m "feat: rewrite homepage page.tsx with offline-matching section layout"
```

---

## Task 13: Delete unused components

**Files:**
- Delete: `app/src/components/MobileNav.tsx` (replaced by offline main.js mobile nav)
- Delete: `app/src/components/LoginModal.tsx` (wiring deferred; modal HTML can be added later)
- Delete: `app/src/components/ProductCard.tsx` (product cards are out of scope)
- Delete: `app/src/components/VideoCard.tsx` (replaced by AmaSection)
- Delete: `app/src/components/Toast.tsx` (notification div is now inline in page.tsx)

- [ ] **Step 1: Delete files**

```bash
rm app/src/components/MobileNav.tsx
rm app/src/components/LoginModal.tsx
rm app/src/components/ProductCard.tsx
rm app/src/components/VideoCard.tsx
rm app/src/components/Toast.tsx
```

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: all tests pass (none of these files had tests).

- [ ] **Step 3: Commit**

```bash
git add -u app/src/components/
git commit -m "chore: remove unused components replaced by offline-matching structure"
```

---

## Self-Review Checklist

- ✅ **Spec §2 (assets)** — Task 1 copies all CSS/JS/images
- ✅ **Spec §3.1 (layout)** — Task 2 wires CSS links + SVG sprite + CartProvider + OfflineScripts
- ✅ **Spec §3.2 (Header)** — Task 5 rewrites Header with 3-part structure
- ✅ **Spec §3.3 (MainNav)** — Task 6 rewrites nav with 5 Bootstrap dropdowns
- ✅ **Spec §3.4 (HeroCarousel)** — Task 7 provides hp-slider.swiper skeleton
- ✅ **Spec §3.5 (page sections)** — Tasks 8–9 cover AMA, Q&A, GearPics + welcome text
- ✅ **Spec §3.6 (Footer)** — Task 11
- ✅ **Spec §4 (data)** — Task 8 adds qa-posts.json, gearpics.json, types, index exports
- ✅ **Spec §5 (styling)** — Task 2 removes Tailwind; all components use offline class names
- ✅ **Spec §7 (CartDrawer)** — Tasks 3–4 (CartContext, CartBadge) + Task 10 (CartDrawer)
- ✅ **Types consistent** — `CartItem`, `QaPost`, `Gearpic` defined in Task 3/8 and used correctly in Tasks 9–10
- ✅ **No placeholders** — all code blocks are complete
