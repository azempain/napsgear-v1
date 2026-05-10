# NapsGear Homepage Redesign — Design Spec

**Date:** 2026-05-09  
**Scope:** Homepage + Header/Nav/Footer (Next.js `app/` directory)  
**Approach:** Option B — copy all CSS/JS from `offline/templates/` into `app/public/`, rewrite React components with exact HTML structure matching the offline site.

---

## 1. Goal

Make the Next.js app (`app/`) look pixel-perfect to the live NapsGear.org website. Ground truth is `offline/index.html` and the offline site's CSS/JS assets. No CDN — everything served locally from `app/public/`.

---

## 2. Asset Strategy

Copy from `offline/templates/` into `app/public/`:

| Source | Destination |
|---|---|
| `offline/templates/css/` (all `.css` files) | `app/public/css/` |
| `offline/templates/js/` (all `.js` files) | `app/public/js/` |
| `offline/templates/img/banners/homepage/` | `app/public/img/banners/homepage/` |
| `offline/templates/img/vimeo/` | `app/public/img/vimeo/` |
| `offline/cdn.napsgear.org/` | `app/public/cdn/` |
| `offline/templates/img/bg_week-product.jpg` | `app/public/img/` |

`app/src/app/layout.tsx` loads them in `<head>` and at end of `<body>`:

```html
<!-- CSS (in <head>) -->
<link rel="stylesheet" href="/css/swiper-bundle.min.css">
<link rel="stylesheet" href="/css/vendors.css">
<link rel="stylesheet" href="/css/main.68a342d0.css">

<!-- JS (end of <body>) -->
<script src="/js/runtime.js"></script>
<script src="/js/bootstrap.bundle.js"></script>
<script src="/js/swiper-bundle.min.js"></script>
<script src="/js/dayjs.min.js"></script>
<script src="/js/vendors.js"></script>
<script src="/js/main.js"></script>
```

`app/src/app/globals.css` keeps only a minimal reset — Tailwind imports are removed.

---

## 3. Component Architecture

All components are Server Components unless noted. Swiper wrappers are `'use client'`.

### 3.1 `layout.tsx`
- Loads offline CSS/JS via `<link>` and `<script>` tags
- Renders SVG icon sprite (`<div style="display:none"><svg>...</svg></div>`) at top of `<body>` — copied verbatim from `offline/index.html`
- Wraps: `Header` → `{children}` → `Footer`

### 3.2 `Header.tsx` (Server Component)
Three-part structure matching offline exactly:

**`header-top`** — white bar, blue bottom border (`#0e95d8`):
- Left: links — Home, Faq, Shipping, Why Naps?, Contact us, Ask an IFBB Pro
- Right: USD currency selector

**`header-middle`** — blue (`#0089cb`), sticky on mobile (`mobile-sticky`):
- Left: NapsGear SVG logo (white, stacked NAPS/GEAR/.ORG) — SVG markup copied from offline
- Center: search form (white input + dark blue search button)
- Right: user icon + `CartBadge` (`'use client'` island) — reads count from existing `CartContext`

**`header-bottom`** — white bar, sticky on desktop (`desktop-sticky`):
- 5 nav items: Brands ▾, Categories ▾, Shipping Locations ▾, Promotions ▾, Info & Entertainment ▾
- Each uses Bootstrap dropdown markup (`.dropdown`, `.dropdown-menu`) — see §3.3

### 3.3 `MainNav.tsx` (Server Component)
Bootstrap 5 mega-menu dropdowns, markup copied from offline:
- **Brands** — mega-menu with accordion groups: U.S. Domestic, International, Peptides, SARMs
- **Categories** — mega-menu grid of category links
- **Shipping Locations** — dropdown list of countries/regions
- **Promotions** — standard dropdown
- **Info & Entertainment** — standard dropdown (AMA, Q&A Forums, GearPics, FAQ, Why Naps, etc.)

### 3.4 `HeroCarousel.tsx` (`'use client'`)
Swiper component initialized with offline's `hp-slider` config:
```jsx
// div.hp-slider.swiper > div.swiper-wrapper > [slides] + div.swiper-pagination
```
Three slides:
1. **Product of Week** — `div.fp-week-product` with `__overlay > __left (60%) + __right (40%)`. Left: promo tag (red), title (bold uppercase dark), product name (blue italic), manufacturer (gray). Right: product image with box shadow. Background: `bg_week-product.jpg`.
2. **AMA Banner** — `<img src="/img/banners/homepage/banner-ama.jpg">` full-width
3. **Weight Loss Peptides** — `<img src="/img/banners/homepage/top-weight-loss/top-weight-loss.jpg">` full-width

Swiper config: `loop: true`, `pagination: { el: '.swiper-pagination', clickable: true }`. Pagination bullets rendered as 32×5px flat rectangles via `.hp-slider .swiper-pagination-bullet` CSS.

### 3.5 `page.tsx` — Homepage sections (Server Component shell + client Swiper islands)

**Welcome text:**
```jsx
<div className="welcome-text">
  <strong>NapsGear.Org</strong> The largest marketplace for pharmaceuticals!
</div>
```

**AMA Section** (`section.ama-firstpage-section.firstpage-section`):
- `'use client'` Swiper: `slidesPerView: 5`, `spaceBetween: 14`, pagination flat bullets (8 total), "SEE MORE VIDEOS →" button
- Cards: `div.post` with `div.post-media > img` (vimeo thumbnail) + `div.post-body` (date + title link)
- Data: read from `app/src/data/ama-videos.json` at build time (static)

**Q&A Forums** (`section.qa-firstpage-section.firstpage-section`):
- `'use client'` Swiper: `slidesPerView: 4`, `spaceBetween: 14`, pagination flat bullets (6 total)
- Cards: rounded 8px, box shadow, date + blue link text + "Read more □"

**GearPics** (`div.gearpics-section.firstpage-section.widget-gearpics`):
- `'use client'` Swiper: `slidesPerView: 4`, `grid: { rows: 3, fill: 'row' }`, `spaceBetween: 0`, prev/next buttons, pagination flat bullets (7 total)
- Each slide: `div.widget-gearpics__item` — `figure` (100×100 thumbnail) left + `div.product-details` (date + title link) right

### 3.6 `Footer.tsx` (Server Component)
`footer.footer.bg-dark`:
- `div.footer-middle`:
  - Left: NapsGear SVG logo (white, same SVG as header)
  - Right: "CUSTOMER SERVICE" heading + 2-col link grid (Home, Why Naps?, Faq, Contact us, Shipping, Ask an IFBB Pro)
  - Below full-width: about heading + paragraph
- `div.footer-bottom`: copyright text centered

---

## 4. Data

- **AMA videos**: static array in `app/src/data/ama-videos.json` — title, date, vimeo thumbnail path
- **Q&A posts**: static array in `app/src/data/qa-posts.json` — date, text, link
- **GearPics**: static array in `app/src/data/gearpics.json` — id, date, title, thumbnail path (from `app/public/cdn/`)
- **Cart count**: React context (`CartContext`) already exists — badge reads from it

No API routes needed for the homepage. All data is static JSON files populated from the offline site's content.

---

## 5. Styling

- Tailwind is removed from `globals.css` (replaced with a bare reset)
- All styles come from the offline CSS files in `public/css/`
- Component JSX uses exact class names from the offline site (e.g., `fp-week-product__left`, `swiper-container`, `widget-gearpics__item`)
- No additional inline styles or Tailwind classes added to components

---

## 6. Responsive Behavior

Inherited from the offline site's Bootstrap 5 grid and the custom `main.css` media queries:
- Mobile: header collapses to logo + hamburger; `header-middle` becomes `.mobile-sticky`
- Desktop: `header-bottom` nav becomes `.desktop-sticky`
- Swiper `slidesPerView` adjusts via Swiper's `breakpoints` config matching offline JS

---


## 7. Cart Drawer

### 7.1 HTML structure (matches offline exactly)

```html
<div id="shoppingCartBox" class="dropdown dropdown-cart">
  <div class="cart-overlay" data-cart-close></div>
  <div class="dropdown-menu mobile-cart">
    <div class="cart-close-overlay">
      <a href="#" title="Close (Esc)" class="btn-close cart-close" data-cart-close></a>
    </div>
    <div class="dropdownmenu-wrapper custom-scrollbar">
      <div class="dropdown-cart-header">Shopping Cart</div>
      <!-- empty state -->
      <p class="pt-3 mt-2">No products in the cart.</p>
      <!-- OR: list of cart items when cart has products -->
    </div>
  </div>
</div>
```

Placed in `layout.tsx` directly after `<Header>` — same position as offline HTML.

### 7.2 Toggle

The cart icon in `header-middle` carries class `cart-toggle`. The offline `main.js` already wires click → open/close on `#shoppingCartBox`. No React state needed for the open/close behaviour — it's handled by the loaded JS.

### 7.3 CartBadge (`'use client'` island)

A tiny client component `CartBadge.tsx` reads item count from the existing `CartContext` and renders:
```jsx
<span className="cart-count badge-circle">{count}</span>
```
Embedded inside the cart icon anchor in `Header.tsx` (which is otherwise a Server Component).

### 7.4 Cart items rendering

`CartDrawer.tsx` is a `'use client'` component that:
- Reads `CartContext` for items array
- When empty: renders `<p className="pt-3 mt-2">No products in the cart.</p>`
- When non-empty: renders a `<ul className="cart-products">` list — each item shows thumbnail, name, qty, price, remove button — matching the offline `.cart-product` markup

### 7.5 Cart state (existing `CartContext`)

The existing `CartContext` (add/update/remove/checkout) is kept as-is. `CartDrawer` and `CartBadge` are consumers only.

---

## 8. Out of Scope (follow-up specs)

- Product detail page (`/[productSlug]`)
- Brands/Categories listing pages
- Static pages (FAQ, Why Naps, Shipping, Contact, AMA)
- Login modal wiring
