# NapsGear — Backend Server & Missing Pages Design

**Date:** 2026-05-03  
**Status:** Approved

---

## Overview

The live napsgear.org site is permanently down. This spec covers:

1. A FastAPI + Jinja2 backend server that serves every page of the site
2. All missing HTML pages built to match the existing `offline/index.html` visual design
3. A session-based cart and email-driven checkout (no payment processor needed)
4. Crypto payment info display (manual confirmation by admin)
5. A Playwright scraper that populates `data/products.json` from ninegear.us including locally downloaded images

The existing `offline/templates/` CSS, JS, and image assets are served unchanged as static files.

---

## Architecture

**Tech stack:** Python 3.11+, FastAPI, Jinja2, itsdangerous (sessions), smtplib (email), Playwright (scraper)

**Directory layout:**

```
server/
  main.py              — FastAPI app entry point
  config.py            — single config: email, SMTP, crypto wallets, secret key
  requirements.txt
  routers/
    pages.py           — all GET page routes
    cart.py            — cart add/remove/view
    checkout.py        — checkout form + order email
    contact.py         — contact form + email
  services/
    email.py           — shared send_email() via smtplib
    cart.py            — read/write cart in signed session cookie
    products.py        — load, filter, and search data/products.json

  templates/
    base.html          — header, megamenu nav (brands + categories injected globally), footer
    index.html
    faq.html
    shipping.html
    why-naps.html
    contact.html
    ask-ifbb-pro.html
    brand.html
    category.html
    product.html
    cart.html
    checkout.html
    order-confirmed.html

scripts/
  scrape_ninegear.py   — Playwright crawler → data/products.json + local images
```

`offline/templates/` is mounted at `/templates/` as a StaticFiles directory. No changes to existing CSS/JS assets.  
`offline/cdn.napsgear.org/` is mounted at `/cdn.napsgear.org/` so locally downloaded product images are served correctly.

---

## Configuration (`server/config.py`)

Single file — all environment-specific values live here:

```python
ADMIN_EMAIL   = "azempain@gmail.com"
SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587
SMTP_USER     = "azempain@gmail.com"
SMTP_PASS     = ""          # Gmail App Password — fill before going live

CRYPTO_WALLETS = {
    "BTC":        "PLACEHOLDER_BTC_ADDRESS",
    "ETH":        "PLACEHOLDER_ETH_ADDRESS",
    "USDT_TRC20": "PLACEHOLDER_USDT_TRC20_ADDRESS",
    "XMR":        "PLACEHOLDER_XMR_ADDRESS",
}

SECRET_KEY = "change-me-before-going-live"   # signs session cookies
```

To swap the admin email or add a wallet address: edit this one file, restart the server.

---

## Routes

| Method | Path | Handler | Template |
|--------|------|---------|----------|
| GET | `/` | pages.home | `index.html` |
| GET | `/faq/` | pages.faq | `faq.html` |
| GET | `/shipping-information/` | pages.shipping | `shipping.html` |
| GET | `/why-naps/` | pages.why_naps | `why-naps.html` |
| GET | `/contact-us/` | contact.get_contact | `contact.html` |
| POST | `/contact-us/` | contact.post_contact | redirect + flash |
| GET | `/ask-an-ifbb-pro/` | pages.ask_ifbb | `ask-ifbb-pro.html` |
| GET | `/brands/{slug}/` | pages.brand | `brand.html` |
| GET | `/categories/{slug}/` | pages.category | `category.html` |
| GET | `/cart/` | cart.view | `cart.html` |
| POST | `/cart/add/` | cart.add | redirect back |
| POST | `/cart/remove/` | cart.remove | redirect to cart |
| GET | `/checkout/` | checkout.get_checkout | `checkout.html` |
| POST | `/checkout/` | checkout.post_checkout | redirect to confirmed |
| GET | `/order-confirmed/` | checkout.confirmed | `order-confirmed.html` |
| GET | `/{product_slug}/` | pages.product | `product.html` |

`/{product_slug}/` is registered last to avoid conflicts. Returns 404 if slug not found in products.

Every route handler receives `brands`, `categories`, and `cart_count` automatically via a Jinja2 global context — no manual injection per route.

---

## Templates

### `base.html`
- Full `<head>` with links to `offline/templates/` CSS
- `<header>` matching `offline/index.html` exactly — logo, search bar (non-functional display), user icon, cart icon with live `cart_count` badge
- `<nav class="main-nav">` megamenu — brands dropdown + categories dropdown populated from `data/brands.json` and `data/categories.json`
- Mobile nav
- `<footer>` matching `offline/index.html`
- All `<script>` tags from `offline/templates/` JS
- `{% block content %}{% endblock %}` between nav and footer

### Page templates (extend `base.html`)
Each page fills in the `content` block. Content for static pages is written to match what the original site provided:

- **faq.html** — accordion-style FAQ (common questions: ordering, payment, shipping, returns)
- **shipping.html** — shipping methods, estimated delivery times, policies by region
- **why-naps.html** — trust signals: quality control, verified suppliers, years in business, testimonials
- **contact.html** — store email/phone display + contact form (name, email, phone, message)
- **ask-ifbb-pro.html** — grid of video cards from `data/videos.json` (thumbnail, title, date)
- **brand.html** — page heading (brand name), product grid filtered by brand slug
- **category.html** — page heading (category name), product grid filtered by category slug
- **product.html** — image gallery, name, price, description, brand, "Add to Cart" form
- **cart.html** — line items (image, name, price, qty, subtotal), total, "Proceed to Checkout" button, "Remove" per item
- **checkout.html** — customer fields + payment method selector + crypto address display
- **order-confirmed.html** — confirmation message, order summary, "we will contact you" note

---

## Cart

Stored as a signed JSON cookie (`itsdangerous.URLSafeSerializer`). No database required.

**Session shape:**
```json
{
  "alpha-pharma-alphabol-10mg": {
    "name": "Alphabol 10mg (50 tabs)",
    "price": 45.00,
    "qty": 2,
    "image": "cdn.napsgear.org/images/products/alphabol-10mg-1.jpg"
  }
}
```

- Cart count (sum of all qty values) injected into every page for the header badge
- Add: POST with `product_slug` + `qty`; merges into existing cart
- Remove: POST with `product_slug`; deletes that key
- Cart persists until cookie expires (30-day expiry) or browser clears cookies

---

## Checkout Flow

1. Customer fills checkout form:
   - Full name, email, phone, country + city/address, order notes (optional)
   - Payment method: `Bank Transfer` | `BTC` | `ETH` | `USDT TRC-20` | `XMR`
   - Selecting a crypto option reveals the wallet address + copy button (JavaScript, inline)

2. On POST `/checkout/`:
   - Server validates all required fields
   - Sends **admin email** to `ADMIN_EMAIL`:
     - Subject: `New Order from {customer_name}`
     - Body: full cart (items, qty, prices, total), customer name/email/phone/address/notes, payment method, wallet address if crypto
   - Sends **customer confirmation email** to customer's email:
     - Subject: `Your NapsGear order has been received`
     - Body: order summary, "our team will contact you to confirm payment and arrange delivery"
   - Clears the cart cookie
   - Redirects to `/order-confirmed/`

3. Crypto flow: customer sends payment to the displayed address, includes tx hash in order notes. Admin confirms receipt manually before fulfilling.

---

## Contact Form Flow

POST `/contact-us/`:
- Fields: name, email, phone, message
- Sends email to `ADMIN_EMAIL` with all fields
- Redirects back to `/contact-us/?sent=1`; the template checks `request.query_params.get("sent")` and shows a success banner if present. No server-side session needed for flash.

---

## Email Service (`server/services/email.py`)

Single `send_email(to, subject, body_html)` function using `smtplib` + `ssl` + Gmail SMTP. All routes call this function — changing the provider means changing one file.

Gmail requires an **App Password** (not the account password). Instructions included in `config.py` comments.

---

## Product Scraper (`scripts/scrape_ninegear.py`)

**Source:** https://ninegear.us/  
**Output:** `data/products.json`, images saved to `offline/cdn.napsgear.org/images/products/`

**Note on `data/categories.json`:** The current file contains brand names, not product categories. The scraper also rebuilds `data/categories.json` with real product categories extracted from ninegear.us (e.g. "Oral Steroids", "Injectable Steroids", "Weight Loss", etc.).

**Crawl strategy:**
1. Visit ninegear.us brand listing page — collect all brand page URLs and names
2. Visit ninegear.us category listing page — collect all category URLs and names; rebuild `data/categories.json`
3. Visit each brand page — collect all product page URLs
4. For each product page, extract:
   - `slug` (derived from URL)
   - `name`
   - `price` (float)
   - `brand_name` (as shown on page) → matched to `data/brands.json` slug by name; stored as brand slug
   - `category_name` (as shown on page) → matched to rebuilt categories.json slug; stored as category slug
   - `description` (HTML stripped to plain text)
   - `images` (all product image URLs → downloaded locally)
   - `in_stock` (boolean, derived from stock indicator on page)
5. Download all product images to `offline/cdn.napsgear.org/images/products/{slug}-{n}.jpg`
6. Rewrite image paths in JSON to local relative paths: `cdn.napsgear.org/images/products/...`
7. Save `data/products.json` incrementally after each product (crash-safe)
8. Skip already-saved slugs on re-run (idempotent)

**Product JSON shape:**
```json
{
  "slug": "alpha-pharma-alphabol-10mg-50tabs",
  "name": "Alphabol 10mg (50 tabs)",
  "price": 45.00,
  "brand": "alpha-pharma-healthcare-c141952",
  "category": "oral-steroids-c14",
  "description": "Methandienone 10mg per tablet...",
  "images": [
    "cdn.napsgear.org/images/products/alphabol-10mg-50tabs-1.jpg"
  ],
  "in_stock": true,
  "tags": []
}
```

---

## Static Page Content

Since the live site is down, content for static pages is written fresh but faithful to what a pharmaceutical marketplace would publish:

- **FAQ** — ordering process, payment methods, shipping times, tracking, returns, account questions
- **Shipping** — domestic vs. international, estimated delivery by region, discreet packaging note, tracking policy
- **Why NapsGear** — supplier vetting process, quality control, years operating, customer volume, money-back policy
- **Contact** — email address (azempain@gmail.com displayed), phone placeholder, contact form

---

## Out of Scope (this phase)

- User accounts / login (modal is display-only, wired in a future phase)
- Product search (search bar is display-only, returns results in a future phase)
- Automated crypto payment verification
- Admin product management panel
- Order history / tracking portal
