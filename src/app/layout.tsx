import type { Metadata, Viewport } from 'next'
import './globals.css'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/grid'
import CartProvider from '@/context/CartContext'
import CurrencyProvider from '@/context/CurrencyContext'
import Header from '@/components/Header'
import CartDrawer from '@/components/CartDrawer'
import Footer from '@/components/Footer'
import NavInteractions from '@/components/NavInteractions'
import ScrollToTop from '@/components/ScrollToTop'
import JsonLd from '@/components/JsonLd'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'
import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonld'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/css/vendors.css" />
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        {/* SVG icon sprite */}
        <svg xmlns="http://www.w3.org/2000/svg" className="icon-sprite">
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

        {/* Site-wide schema.org JSON-LD — Organization (knowledge panel) and
            WebSite (sitelinks search box). Per-route schemas (Product,
            BreadcrumbList) ship from their own page files. */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

        <Providers>
          <CurrencyProvider>
            <CartProvider>
              <ScrollToTop />
              <Header />
              <CartDrawer />
              <div className='min-h-screen'>
                {children}
              </div>
              <Footer />
            </CartProvider>
          </CurrencyProvider>
        </Providers>
        <NavInteractions />
      </body>
    </html>
  )
}
