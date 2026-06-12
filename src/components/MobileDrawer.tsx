'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { brands, categories } from '@/data'
import NapsGearLogo from './NapsGearLogo'
import { SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

type Expanded = 'brands' | 'categories' | 'promotions' | 'information' | null

const SUPPORT_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/shipping-information/', label: 'Shipping' },
  { href: '/why-naps/', label: 'Why Naps?' },
  { href: '/contact-us/', label: 'Contact us' },
  { href: '/ask-an-ifbb-pro/', label: 'Ask an IFBB Pro' },
]

const PROMOTION_LINKS = [
  { href: '/store-credit/', label: 'Earn Store Credit' },
  { href: '/aas-diaries/', label: 'AAS Diaries' },
  { href: '/affiliate-program/', label: 'Affiliate Program' },
  { href: '/reviews-for-cash/', label: 'Reviews for Cash' },
  { href: '/promotions/', label: 'All Promotions' },
]

const INFORMATION_LINKS = [
  { href: '/laboratory-tests/', label: 'Laboratory Tests' },
  { href: '/project-get-shredded/', label: 'Project Get Shredded' },
  { href: '/community-gearpics/', label: 'Community Gear Pics' },
  { href: '/qa/', label: 'Live Q&A Forums' },
]

export default function MobileDrawer({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<Expanded>(null)
  const brandList = brands.filter(brand => brand.slug)

  function toggle(section: Exclude<Expanded, null>) {
    setExpanded(current => current === section ? null : section)
  }

  function section(
    id: Exclude<Expanded, null>,
    label: string,
    links: Array<{ href: string; label: string }>,
  ) {
    const open = expanded === id
    return (
      <>
        <button
          type="button"
          className="mobile-drawer__section"
          aria-expanded={open ? 'true' : 'false'}
          onClick={() => toggle(id)}
        >
          <span>{label}</span>
          <ChevronDown size={16} aria-hidden="true" className="mobile-drawer__chev" />
        </button>
        {open && (
          <ul className="mobile-drawer__list">
            {links.map(link => (
              <li key={link.href}>
                <Link className="mobile-drawer__link" href={link.href} onClick={onClose}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>
    )
  }

  return (
    <SheetContent id="mobileDrawer">
      <SheetTitle className="sr-only">Main navigation</SheetTitle>
      <SheetDescription className="sr-only">
        Browse products, promotions, support, and account links.
      </SheetDescription>

      <div className="mobile-drawer__header">
        <Link href="/" className="mobile-drawer__brand" aria-label="NapsGear home" onClick={onClose}>
          <NapsGearLogo />
        </Link>
      </div>

      <nav className="mobile-drawer__nav" aria-label="Mobile primary">
        {section('brands', 'Brands', brandList.map(brand => ({
          href: `/brands/${brand.slug!}/`,
          label: brand.name,
        })))}
        {section('categories', 'Categories', categories.map(category => ({
          href: `/categories/${category.slug}/`,
          label: category.name,
        })))}
        {section('promotions', 'Promotions', PROMOTION_LINKS)}
        {section('information', 'Info & Entertainment', INFORMATION_LINKS)}

        <div className="mobile-drawer__divider" aria-hidden="true" />
        <ul className="mobile-drawer__list mobile-drawer__list--flat">
          {SUPPORT_LINKS.map(link => (
            <li key={link.href}>
              <Link className="mobile-drawer__link" href={link.href} onClick={onClose}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </SheetContent>
  )
}
