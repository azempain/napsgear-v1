# Next.js 16 Scaffold Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `app/` Next.js 16 application alongside the existing `offline/` site, wired to the shared `data/*.json` files, with all routes and components in place ready for page-by-page visual migration.

**Architecture:** Next.js 16 App Router with `output: 'export'` (fully static, no server). React 19 + TypeScript 5 strict + Tailwind CSS v4. The `data/*.json` files (already populated by `scripts/extract_data.py`) are imported at build time for `generateStaticParams`. Components are minimum-viable scaffolds — they render the right structure with the right data, but visual fidelity to `offline/` is left for the migration phase that follows this plan.

**Tech Stack:** Next.js 16.2+, React 19, TypeScript 5, Tailwind CSS v4, Vitest (data-layer tests only)

**Note:** Visual parity with `offline/` is **out of scope** for this plan. The output of this plan is a building, type-safe app skeleton. The migration phase that follows will port styles page-by-page using `offline/<page>/index.html` as the visual reference.

**Worktree:** This plan should be executed in a dedicated worktree. Create one with `git worktree add .claude/worktrees/nextjs-scaffold -b claude/nextjs-scaffold` before starting.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/package.json` | Dependencies, scripts |
| Create | `app/tsconfig.json` | TypeScript strict config |
| Create | `app/next.config.ts` | Static export, trailing slash |
| Create | `app/postcss.config.mjs` | Tailwind v4 PostCSS plugin |
| Create | `app/.gitignore` | Ignore `.next/`, `out/`, `node_modules/` |
| Create | `app/vitest.config.ts` | Vitest config for data-layer tests |
| Create | `app/src/data/types.ts` | TypeScript types for all JSON shapes |
| Create | `app/src/data/index.ts` | Typed JSON imports |
| Create | `app/src/data/index.test.ts` | Type/shape assertions |
| Create | `app/src/app/globals.css` | Tailwind v4 entry + base styles |
| Create | `app/src/app/layout.tsx` | Root layout with `<html>`/`<body>` |
| Create | `app/src/app/page.tsx` | Home page composition |
| Create | `app/src/app/faq/page.tsx` | FAQ static page |
| Create | `app/src/app/shipping-information/page.tsx` | Shipping page |
| Create | `app/src/app/why-naps/page.tsx` | Why Naps page |
| Create | `app/src/app/contact-us/page.tsx` | Contact page |
| Create | `app/src/app/ask-an-ifbb-pro/page.tsx` | Ask-IFBB-pro page |
| Create | `app/src/app/brands/[slug]/page.tsx` | Dynamic brand page |
| Create | `app/src/app/categories/[slug]/page.tsx` | Dynamic category page |
| Create | `app/src/app/[productSlug]/page.tsx` | Dynamic product page |
| Create | `app/src/components/Header.tsx` | Top header strip |
| Create | `app/src/components/MainNav.tsx` | Desktop nav with brands/categories |
| Create | `app/src/components/MobileNav.tsx` | Mobile drawer nav |
| Create | `app/src/components/HeroCarousel.tsx` | Home hero (static placeholder slides) |
| Create | `app/src/components/VideoCard.tsx` | AMA video card |
| Create | `app/src/components/ProductCard.tsx` | Product card |
| Create | `app/src/components/LoginModal.tsx` | Display-only login modal |
| Create | `app/src/components/CartDrawer.tsx` | Display-only cart drawer |
| Create | `app/src/components/Footer.tsx` | Site footer |
| Create | `app/src/components/Toast.tsx` | Toast notification |
| Modify | `.gitignore` (root) | Add `app/node_modules`, `app/.next`, `app/out` |

---

## Task 1: Initialise the `app/` Next.js Project

**Files:**
- Create: `app/package.json`
- Create: `app/tsconfig.json`
- Create: `app/next.config.ts`
- Create: `app/.gitignore`
- Modify: `.gitignore` (root)

- [ ] **Step 1.1: Create `app/` directory and write `app/package.json`**

```json
{
  "name": "napsgear-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^16.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 1.2: Write `app/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@data/*": ["../data/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out", ".next"]
}
```

- [ ] **Step 1.3: Write `app/next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

- [ ] **Step 1.4: Write `app/.gitignore`**

```
node_modules/
.next/
out/
next-env.d.ts
*.tsbuildinfo
```

- [ ] **Step 1.5: Append app paths to root `.gitignore`**

If root `.gitignore` doesn't exist, create it. Append:

```
app/node_modules/
app/.next/
app/out/
app/next-env.d.ts
```

- [ ] **Step 1.6: Install dependencies**

```bash
cd app && npm install
```

Expected: `added N packages` with no errors.

- [ ] **Step 1.7: Commit**

```bash
git add app/package.json app/package-lock.json app/tsconfig.json app/next.config.ts app/.gitignore .gitignore
git commit -m "feat(app): scaffold Next.js 16 project skeleton"
```

---

## Task 2: Configure Tailwind CSS v4

**Files:**
- Create: `app/postcss.config.mjs`
- Create: `app/src/app/globals.css`

- [ ] **Step 2.1: Write `app/postcss.config.mjs`**

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

- [ ] **Step 2.2: Write `app/src/app/globals.css`**

Tailwind v4 uses a single `@import` and inline `@theme` block (no `tailwind.config.*` required for the basic setup):

```css
@import "tailwindcss";

@theme {
  --font-family-sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family-sans);
  color: #111;
  background: #fff;
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 2.3: Commit**

```bash
git add app/postcss.config.mjs app/src/app/globals.css
git commit -m "feat(app): add Tailwind CSS v4 setup"
```

---

## Task 3: Add the Data Layer (Types + Imports + Tests)

**Files:**
- Create: `app/src/data/types.ts`
- Create: `app/src/data/index.ts`
- Create: `app/src/data/index.test.ts`
- Create: `app/vitest.config.ts`

- [ ] **Step 3.1: Write `app/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, '../data'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
  },
})
```

- [ ] **Step 3.2: Write `app/src/data/types.ts`**

Schemas match the actual JSON written by `scripts/extract_data.py`:

```typescript
export interface Brand {
  slug: string
  name: string
  id: number | null
  url: string
}

export interface Category {
  slug: string
  name: string
  url: string
}

export interface Video {
  url: string
  title: string
  date: string
  thumbnail: string
}

export interface Product {
  slug: string
  name: string
  description: string
  images: string[]
}
```

- [ ] **Step 3.3: Write the failing data-layer test**

Create `app/src/data/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { brands, categories, videos, products } from './index'

describe('data layer', () => {
  it('brands is a non-empty array of Brand', () => {
    expect(Array.isArray(brands)).toBe(true)
    expect(brands.length).toBeGreaterThan(0)
    const b = brands[0]
    expect(typeof b.slug).toBe('string')
    expect(typeof b.name).toBe('string')
    expect(typeof b.url).toBe('string')
  })

  it('categories is a non-empty array of Category', () => {
    expect(Array.isArray(categories)).toBe(true)
    expect(categories.length).toBeGreaterThan(0)
    expect(typeof categories[0].slug).toBe('string')
  })

  it('videos is an array', () => {
    expect(Array.isArray(videos)).toBe(true)
  })

  it('products is an array (may be empty)', () => {
    expect(Array.isArray(products)).toBe(true)
  })
})
```

- [ ] **Step 3.4: Run the test — expect import failure**

```bash
cd app && npx vitest run src/data
```

Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 3.5: Write `app/src/data/index.ts`**

```typescript
import brandsJson from '@data/brands.json'
import categoriesJson from '@data/categories.json'
import videosJson from '@data/videos.json'
import productsJson from '@data/products.json'
import type { Brand, Category, Video, Product } from './types'

export const brands: Brand[] = brandsJson as Brand[]
export const categories: Category[] = categoriesJson as Category[]
export const videos: Video[] = videosJson as Video[]
export const products: Product[] = productsJson as Product[]

export type { Brand, Category, Video, Product }
```

- [ ] **Step 3.6: Run the test — expect pass**

```bash
cd app && npx vitest run src/data
```

Expected: 4 tests PASSED.

- [ ] **Step 3.7: Commit**

```bash
git add app/vitest.config.ts app/src/data/
git commit -m "feat(app): add data layer with typed JSON imports and tests"
```

---

## Task 4: Build Root Layout

**Files:**
- Create: `app/src/app/layout.tsx`

- [ ] **Step 4.1: Write `app/src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NapsGear',
  description: 'NapsGear — performance enhancement supplements',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4.2: Commit**

```bash
git add app/src/app/layout.tsx
git commit -m "feat(app): add root layout"
```

---

## Task 5: Build Header Component

**Files:**
- Create: `app/src/components/Header.tsx`

- [ ] **Step 5.1: Write `app/src/components/Header.tsx`**

Mirror the `#header .header-middle` structure from `offline/index.html` at minimum-viable level — logo placeholder + search input + cart button:

```typescript
export default function Header() {
  return (
    <header id="header" className="border-b border-gray-200 bg-white">
      <div className="header-middle mx-auto flex max-w-7xl items-center gap-6 px-4 py-4">
        <a href="/" className="text-xl font-bold tracking-tight">
          NapsGear
        </a>

        <form className="flex flex-1 items-center" role="search">
          <input
            type="search"
            placeholder="Search products..."
            className="w-full rounded-l border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-r bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        <button
          type="button"
          className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          aria-label="Open cart"
        >
          Cart
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 5.2: Commit**

```bash
git add app/src/components/Header.tsx
git commit -m "feat(app): add Header component"
```

---

## Task 6: Build Footer Component

**Files:**
- Create: `app/src/components/Footer.tsx`

- [ ] **Step 6.1: Write `app/src/components/Footer.tsx`**

```typescript
export default function Footer() {
  return (
    <footer className="footer mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Customer Service
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/faq/">FAQ</a></li>
            <li><a href="/shipping-information/">Shipping Information</a></li>
            <li><a href="/contact-us/">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            About
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/why-naps/">Why NapsGear</a></li>
            <li><a href="/ask-an-ifbb-pro/">Ask an IFBB Pro</a></li>
          </ul>
        </div>
        <div className="sm:col-span-2 md:col-span-2">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} NapsGear. Static export — offline mirror.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 6.2: Commit**

```bash
git add app/src/components/Footer.tsx
git commit -m "feat(app): add Footer component"
```

---

## Task 7: Build MainNav Component

**Files:**
- Create: `app/src/components/MainNav.tsx`

- [ ] **Step 7.1: Write `app/src/components/MainNav.tsx`**

Renders the brand and category mega-menus from `data/*.json`:

```typescript
import { brands, categories } from '@/data'

export default function MainNav() {
  return (
    <nav className="main-nav border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
        <details className="menu-item-dropdown group relative">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium hover:bg-gray-50">
            Brands ({brands.length})
          </summary>
          <div className="menu-item__sub absolute left-0 top-full z-10 grid max-h-96 w-72 grid-cols-1 gap-px overflow-y-auto border border-gray-200 bg-white shadow-lg">
            {brands.map((b) => (
              <a
                key={b.slug}
                href={`/brands/${b.slug}/`}
                className="block px-4 py-2 text-sm hover:bg-gray-50"
              >
                {b.name}
              </a>
            ))}
          </div>
        </details>

        <details className="menu-item-dropdown group relative">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium hover:bg-gray-50">
            Categories ({categories.length})
          </summary>
          <div className="menu-item__sub absolute left-0 top-full z-10 grid max-h-96 w-72 grid-cols-1 gap-px overflow-y-auto border border-gray-200 bg-white shadow-lg">
            {categories.map((c) => (
              <a
                key={c.slug}
                href={`/categories/${c.slug}/`}
                className="block px-4 py-2 text-sm hover:bg-gray-50"
              >
                {c.name}
              </a>
            ))}
          </div>
        </details>

        <a href="/why-naps/" className="px-4 py-3 text-sm font-medium hover:bg-gray-50">Why NapsGear</a>
        <a href="/ask-an-ifbb-pro/" className="px-4 py-3 text-sm font-medium hover:bg-gray-50">Ask an IFBB Pro</a>
        <a href="/faq/" className="px-4 py-3 text-sm font-medium hover:bg-gray-50">FAQ</a>
      </div>
    </nav>
  )
}
```

- [ ] **Step 7.2: Commit**

```bash
git add app/src/components/MainNav.tsx
git commit -m "feat(app): add MainNav with brand and category menus"
```

---

## Task 8: Build MobileNav Component

**Files:**
- Create: `app/src/components/MobileNav.tsx`

- [ ] **Step 8.1: Write `app/src/components/MobileNav.tsx`**

```typescript
import { brands, categories } from '@/data'

export default function MobileNav() {
  return (
    <nav id="navigationMenu" className="md:hidden border-b border-gray-200 bg-white">
      <details className="border-b border-gray-100">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Brands</summary>
        <div className="bg-gray-50">
          {brands.map((b) => (
            <a
              key={b.slug}
              href={`/brands/${b.slug}/`}
              className="block px-6 py-2 text-sm hover:bg-white"
            >
              {b.name}
            </a>
          ))}
        </div>
      </details>
      <details className="border-b border-gray-100">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Categories</summary>
        <div className="bg-gray-50">
          {categories.map((c) => (
            <a
              key={c.slug}
              href={`/categories/${c.slug}/`}
              className="block px-6 py-2 text-sm hover:bg-white"
            >
              {c.name}
            </a>
          ))}
        </div>
      </details>
      <a href="/faq/" className="block border-b border-gray-100 px-4 py-3 text-sm">FAQ</a>
      <a href="/shipping-information/" className="block border-b border-gray-100 px-4 py-3 text-sm">Shipping</a>
      <a href="/contact-us/" className="block px-4 py-3 text-sm">Contact</a>
    </nav>
  )
}
```

- [ ] **Step 8.2: Commit**

```bash
git add app/src/components/MobileNav.tsx
git commit -m "feat(app): add MobileNav component"
```

---

## Task 9: Build ProductCard Component

**Files:**
- Create: `app/src/components/ProductCard.tsx`

- [ ] **Step 9.1: Write `app/src/components/ProductCard.tsx`**

```typescript
import type { Product } from '@/data/types'

export default function ProductCard({ product }: { product: Product }) {
  const thumb = product.images[0] ?? ''
  return (
    <article className="widget-gearpics__item flex flex-col overflow-hidden rounded border border-gray-200 bg-white">
      {thumb ? (
        <img
          src={thumb}
          alt={product.name}
          className="aspect-square w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="aspect-square w-full bg-gray-100" aria-hidden="true" />
      )}
      <div className="p-3">
        <a
          href={`/${product.slug}/`}
          className="line-clamp-2 text-sm font-medium hover:underline"
        >
          {product.name}
        </a>
      </div>
    </article>
  )
}
```

- [ ] **Step 9.2: Commit**

```bash
git add app/src/components/ProductCard.tsx
git commit -m "feat(app): add ProductCard component"
```

---

## Task 10: Build VideoCard Component

**Files:**
- Create: `app/src/components/VideoCard.tsx`

- [ ] **Step 10.1: Write `app/src/components/VideoCard.tsx`**

```typescript
import type { Video } from '@/data/types'

export default function VideoCard({ video }: { video: Video }) {
  return (
    <article className="post overflow-hidden rounded border border-gray-200 bg-white">
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="aspect-video w-full bg-gray-100" aria-hidden="true" />
      )}
      <div className="p-3">
        <h3 className="post-title line-clamp-2 text-sm font-medium">
          <a href={video.url}>{video.title}</a>
        </h3>
        {video.date && (
          <time className="post-date mt-1 block text-xs text-gray-500">{video.date}</time>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 10.2: Commit**

```bash
git add app/src/components/VideoCard.tsx
git commit -m "feat(app): add VideoCard component"
```

---

## Task 11: Build HeroCarousel Component (Static Placeholder)

**Files:**
- Create: `app/src/components/HeroCarousel.tsx`

- [ ] **Step 11.1: Write `app/src/components/HeroCarousel.tsx`**

Real swiper integration is out of scope; render the first slide statically. Migration phase will replace with a real carousel.

```typescript
interface Slide {
  title: string
  subtitle?: string
  href?: string
}

const SLIDES: Slide[] = [
  { title: 'Welcome to NapsGear', subtitle: 'Discover top brands & products', href: '/categories/' },
]

export default function HeroCarousel({ slides = SLIDES }: { slides?: Slide[] }) {
  const slide = slides[0]
  return (
    <section className="hp-slider bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-16 sm:py-24">
        <h1 className="text-3xl font-bold sm:text-5xl">{slide.title}</h1>
        {slide.subtitle && <p className="text-lg opacity-90">{slide.subtitle}</p>}
        {slide.href && (
          <a
            href={slide.href}
            className="mt-4 inline-block rounded bg-white px-6 py-2 text-sm font-medium text-blue-700 hover:bg-gray-100"
          >
            Browse
          </a>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 11.2: Commit**

```bash
git add app/src/components/HeroCarousel.tsx
git commit -m "feat(app): add HeroCarousel placeholder component"
```

---

## Task 12: Build Display-Only Modals & Toast

**Files:**
- Create: `app/src/components/LoginModal.tsx`
- Create: `app/src/components/CartDrawer.tsx`
- Create: `app/src/components/Toast.tsx`

These render hidden by default. The migration phase will wire them to client interactivity. For now they exist so the page composition matches `offline/`.

- [ ] **Step 12.1: Write `app/src/components/LoginModal.tsx`**

```typescript
export default function LoginModal() {
  return (
    <div
      id="loginModal"
      className="hidden fixed inset-0 z-50 items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-hidden="true"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Sign In</h2>
        <form className="space-y-3">
          <input type="email" placeholder="Email" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          <input type="password" placeholder="Password" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.2: Write `app/src/components/CartDrawer.tsx`**

```typescript
export default function CartDrawer() {
  return (
    <aside
      id="shoppingCartBox"
      className="hidden fixed right-0 top-0 z-40 h-full w-80 bg-white shadow-xl"
      aria-hidden="true"
    >
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Your Cart</h2>
      </div>
      <div className="p-4 text-sm text-gray-500">Your cart is empty.</div>
    </aside>
  )
}
```

- [ ] **Step 12.3: Write `app/src/components/Toast.tsx`**

```typescript
export default function Toast({
  message = '',
  type = 'info',
}: {
  message?: string
  type?: 'info' | 'success' | 'error'
}) {
  if (!message) return null
  const colorMap: Record<string, string> = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
  }
  return (
    <div
      className={`notification fixed bottom-4 right-4 z-50 rounded px-4 py-2 text-sm text-white shadow-lg ${colorMap[type]}`}
      role="status"
    >
      {message}
    </div>
  )
}
```

- [ ] **Step 12.4: Commit**

```bash
git add app/src/components/LoginModal.tsx app/src/components/CartDrawer.tsx app/src/components/Toast.tsx
git commit -m "feat(app): add LoginModal, CartDrawer, Toast scaffolds"
```

---

## Task 13: Build the Home Page

**Files:**
- Create: `app/src/app/page.tsx`

- [ ] **Step 13.1: Write `app/src/app/page.tsx`**

```typescript
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import HeroCarousel from '@/components/HeroCarousel'
import VideoCard from '@/components/VideoCard'
import ProductCard from '@/components/ProductCard'
import LoginModal from '@/components/LoginModal'
import CartDrawer from '@/components/CartDrawer'
import Footer from '@/components/Footer'
import { videos, products } from '@/data'

export default function HomePage() {
  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />

      <main>
        <HeroCarousel />

        {products.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-10">
            <h2 className="mb-6 text-2xl font-bold">Featured Products</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.slice(0, 10).map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}

        {videos.length > 0 && (
          <section className="ama-firstpage-section mx-auto max-w-7xl px-4 py-10">
            <h2 className="mb-6 text-2xl font-bold">Ask an IFBB Pro</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {videos.map((v) => (
                <VideoCard key={v.url} video={v} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <LoginModal />
      <CartDrawer />
    </>
  )
}
```

- [ ] **Step 13.2: Commit**

```bash
git add app/src/app/page.tsx
git commit -m "feat(app): add home page composition"
```

---

## Task 14: Build the 5 Static Nav Pages

**Files:**
- Create: `app/src/app/faq/page.tsx`
- Create: `app/src/app/shipping-information/page.tsx`
- Create: `app/src/app/why-naps/page.tsx`
- Create: `app/src/app/contact-us/page.tsx`
- Create: `app/src/app/ask-an-ifbb-pro/page.tsx`

Each page wraps Header + MainNav + main content stub + Footer. Content stubs are intentionally generic; the migration phase will port the real text from `offline/<slug>/index.html` once those pages have been grabbed.

- [ ] **Step 14.1: Write `app/src/app/faq/page.tsx`**

```typescript
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'

export const metadata = { title: 'FAQ — NapsGear' }

export default function FAQPage() {
  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-gray-700">
          Content TBD — migrate from <code>offline/faq/index.html</code> once grabbed.
        </p>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 14.2: Write `app/src/app/shipping-information/page.tsx`**

```typescript
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'

export const metadata = { title: 'Shipping Information — NapsGear' }

export default function ShippingPage() {
  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Shipping Information</h1>
        <p className="text-gray-700">
          Content TBD — migrate from <code>offline/shipping-information/index.html</code>.
        </p>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 14.3: Write `app/src/app/why-naps/page.tsx`**

```typescript
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'

export const metadata = { title: 'Why NapsGear' }

export default function WhyNapsPage() {
  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Why NapsGear</h1>
        <p className="text-gray-700">
          Content TBD — migrate from <code>offline/why-naps/index.html</code>.
        </p>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 14.4: Write `app/src/app/contact-us/page.tsx`**

```typescript
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'

export const metadata = { title: 'Contact Us — NapsGear' }

export default function ContactPage() {
  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Contact Us</h1>
        <p className="text-gray-700">
          Content TBD — migrate from <code>offline/contact-us/index.html</code>.
        </p>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 14.5: Write `app/src/app/ask-an-ifbb-pro/page.tsx`**

```typescript
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'
import VideoCard from '@/components/VideoCard'
import { videos } from '@/data'

export const metadata = { title: 'Ask an IFBB Pro — NapsGear' }

export default function AskIfbbProPage() {
  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Ask an IFBB Pro</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.url} video={v} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 14.6: Commit**

```bash
git add app/src/app/faq app/src/app/shipping-information app/src/app/why-naps app/src/app/contact-us app/src/app/ask-an-ifbb-pro
git commit -m "feat(app): add 5 static nav pages"
```

---

## Task 15: Build Brand and Category Dynamic Pages

**Files:**
- Create: `app/src/app/brands/[slug]/page.tsx`
- Create: `app/src/app/categories/[slug]/page.tsx`

- [ ] **Step 15.1: Write `app/src/app/brands/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'
import { brands, products } from '@/data'
import ProductCard from '@/components/ProductCard'

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }))
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const brand = brands.find((b) => b.slug === slug)
  if (!brand) notFound()

  // Until products.json is populated with brand metadata, this returns nothing.
  const brandProducts = products.filter((p) => p.slug.includes(brand.slug.split('-c')[0]))

  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">{brand.name}</h1>
        {brandProducts.length === 0 ? (
          <p className="text-gray-600">No products grabbed yet for this brand.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {brandProducts.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 15.2: Write `app/src/app/categories/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'
import { categories, products } from '@/data'
import ProductCard from '@/components/ProductCard'

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }))
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = categories.find((c) => c.slug === slug)
  if (!category) notFound()

  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">{category.name}</h1>
        <p className="mb-8 text-gray-600">No products grabbed yet for this category.</p>
        {products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.slice(0, 20).map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 15.3: Commit**

```bash
git add app/src/app/brands app/src/app/categories
git commit -m "feat(app): add brands/[slug] and categories/[slug] dynamic routes"
```

---

## Task 16: Build the [productSlug] Dynamic Page

**Files:**
- Create: `app/src/app/[productSlug]/page.tsx`

- [ ] **Step 16.1: Write `app/src/app/[productSlug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MainNav from '@/components/MainNav'
import MobileNav from '@/components/MobileNav'
import Footer from '@/components/Footer'
import { products } from '@/data'

export function generateStaticParams() {
  return products.map((p) => ({ productSlug: p.slug }))
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productSlug: string }>
}) {
  const { productSlug } = await params
  const product = products.find((p) => p.slug === productSlug)
  if (!product) notFound()

  return (
    <>
      <Header />
      <MainNav />
      <MobileNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">{product.name}</h1>
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="mb-6 w-full max-w-md rounded border border-gray-200"
          />
        )}
        <p className="whitespace-pre-line text-gray-700">{product.description}</p>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 16.2: Commit**

```bash
git add app/src/app/[productSlug]
git commit -m "feat(app): add [productSlug] dynamic product page"
```

---

## Task 17: Verify Build & Static Export

**Files:** none (verification only)

- [ ] **Step 17.1: Run `next build`**

```bash
cd app && npm run build
```

Expected: build succeeds with output `Route (app)` listings for `/`, `/faq/`, `/shipping-information/`, `/why-naps/`, `/contact-us/`, `/ask-an-ifbb-pro/`, plus dynamic `/brands/[slug]/` (60 entries from `brands.json`), `/categories/[slug]/` (120 entries), and `/[productSlug]/` (0 entries until products are grabbed). All pages should be marked `○ (Static)` or `● (SSG)`. No TypeScript errors.

If TypeScript errors appear: read each one, fix the corresponding source file, and re-run. Common issues:
- Missing imports → add the named import
- Wrong path alias → check `tsconfig.json` `paths`
- JSON shape mismatch → compare `data/types.ts` to actual JSON structure

- [ ] **Step 17.2: Verify static output**

```bash
cd app && ls out/
```

Expected: `index.html` plus `faq/`, `shipping-information/`, `why-naps/`, `contact-us/`, `ask-an-ifbb-pro/`, `brands/`, `categories/` directories. Each contains `index.html`.

- [ ] **Step 17.3: Spot-check a generated page**

```bash
cd app && head -20 out/faq/index.html
```

Expected: HTML beginning with `<!DOCTYPE html>` containing the FAQ page content.

- [ ] **Step 17.4: Run all tests one more time**

```bash
cd app && npm test
```

Expected: 4 data-layer tests PASSED.

- [ ] **Step 17.5: Commit (build artefacts are gitignored, so this commit may be empty — that is fine)**

```bash
git status
# If clean, skip this step. If something is uncommitted (e.g. forgotten snippet), commit it.
```

---

## Self-Review Checklist

- [x] **Spec: Next.js 16 + React 19 + TypeScript strict** — Task 1 ✓
- [x] **Spec: Tailwind CSS v4** — Task 2 ✓
- [x] **Spec: `output: 'export'` static-only** — Task 1 (next.config.ts) ✓
- [x] **Spec: trailing slash for `file://` compatibility** — Task 1 ✓
- [x] **Spec: `data/*.json` is the data source** — Task 3 ✓
- [x] **Spec: typed JSON imports** — Task 3 (Brand, Category, Video, Product) ✓
- [x] **Spec: routing mirrors `offline/` paths** — Tasks 13–16 cover all 9 routes ✓
- [x] **Spec: `[productSlug]` dynamic segment with `generateStaticParams`** — Task 16 ✓
- [x] **Spec: brands/[slug] and categories/[slug] dynamic** — Task 15 ✓
- [x] **Spec: 10 components** — Header (5), MainNav (7), MobileNav (8), HeroCarousel (11), VideoCard (10), ProductCard (9), LoginModal/CartDrawer/Toast (12), Footer (6) ✓
- [x] **Spec: PHP-only features (search, cart, login, Q&A) are display-only** — LoginModal, CartDrawer, Toast in Task 12; Header has display-only search and cart button in Task 5 ✓
- [x] **Spec: products.json starts empty, page exists for migration** — Task 16 ✓
- [x] **Spec: build produces static HTML for visual comparison against `offline/`** — Task 17 ✓

**Out of scope (migration phase, not this plan):**
- Real swiper/carousel JS interactivity
- Real cart/login/search behaviour
- Visual fidelity / pixel-perfect styling against `offline/`
- Image optimisation (set `unoptimized: true` in `next.config.ts`)

---

## Usage After This Plan Completes

**To develop locally:**
```bash
cd app && npm run dev
# Open http://localhost:3000
```

**To produce a static build:**
```bash
cd app && npm run build
# Output in app/out/ — open out/index.html in any browser
```

**To run tests:**
```bash
cd app && npm test
```

**Migration phase (future, page-by-page):**
1. Pick a page (e.g. FAQ)
2. Open `offline/faq/index.html` as the visual reference
3. Update `app/src/app/faq/page.tsx` and any components to match
4. `npm run build` → compare `app/out/faq/index.html` rendering against the offline reference
5. Once a page matches, move on. Repeat until the offline mirror can be retired.
