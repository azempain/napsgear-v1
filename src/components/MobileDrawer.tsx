'use client'
import { useEffect, useRef, useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { brands, categories } from '@/data'
import NapsGearLogo from './NapsGearLogo'

type Expanded = 'brands' | 'categories' | null

const INFO_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/shipping-information/', label: 'Shipping' },
  { href: '/why-naps/', label: 'Why Naps?' },
  { href: '/contact-us/', label: 'Contact us' },
  { href: '/ask-an-ifbb-pro/', label: 'Ask an IFBB Pro' },
  { href: '/references/', label: 'References' },
  { href: '/help/', label: 'Help' },
]

export default function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState<Expanded>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  // Esc to close
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Body scroll lock while open (restores prior value on close)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Focus the close button when opening; reset the accordion state when closing
  // so reopening doesn't show a stale expanded section.
  useEffect(() => {
    if (open) closeBtn.current?.focus()
    else setExpanded(null)
  }, [open])

  const brandList = brands.filter(b => b.slug)

  return (
    <div
      className={`mobile-drawer-root${open ? ' open' : ''}`}
      aria-hidden={!open}
    >
      <div className="mobile-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        id="mobileDrawer"
        className="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
      >
        <div className="mobile-drawer__header">
          <a href="/" className="mobile-drawer__brand" aria-label="NapsGear home" onClick={onClose}>
            <NapsGearLogo />
          </a>
          <button
            ref={closeBtn}
            type="button"
            className="mobile-drawer__close"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="mobile-drawer__nav" aria-label="Mobile primary">
          <button
            type="button"
            className="mobile-drawer__section"
            aria-expanded={expanded === 'brands' ? 'true' : 'false'}
            onClick={() => setExpanded(expanded === 'brands' ? null : 'brands')}
          >
            <span>Brands</span>
            <ChevronDown size={16} aria-hidden="true" className="mobile-drawer__chev" />
          </button>
          {expanded === 'brands' && (
            <ul className="mobile-drawer__list">
              {brandList.map(b => (
                <li key={b.slug}>
                  <a
                    className="mobile-drawer__link"
                    href={`/brands/${b.slug!}/`}
                    onClick={onClose}
                  >
                    {b.name}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="mobile-drawer__section"
            aria-expanded={expanded === 'categories' ? 'true' : 'false'}
            onClick={() => setExpanded(expanded === 'categories' ? null : 'categories')}
          >
            <span>Categories</span>
            <ChevronDown size={16} aria-hidden="true" className="mobile-drawer__chev" />
          </button>
          {expanded === 'categories' && (
            <ul className="mobile-drawer__list">
              {categories.map(c => (
                <li key={c.slug}>
                  <a
                    className="mobile-drawer__link"
                    href={`/categories/${c.slug}/`}
                    onClick={onClose}
                  >
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="mobile-drawer__divider" aria-hidden="true" />

          <ul className="mobile-drawer__list mobile-drawer__list--flat">
            {INFO_LINKS.map(link => (
              <li key={link.href}>
                <a
                  className="mobile-drawer__link"
                  href={link.href}
                  onClick={onClose}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  )
}
