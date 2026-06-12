'use client'

import { Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useAppUiStore } from '@/store/appUiStore'

export default function MobileHeaderSearch() {
  const open = useAppUiStore(state => state.mobileSearchOpen)
  const setOpen = useAppUiStore(state => state.setMobileSearchOpen)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  return (
    <>
      <button
        type="button"
        className="header-icon ngc-mobile-search"
        aria-label={open ? 'Close product search' : 'Search products'}
        aria-expanded={open ? 'true' : 'false'}
        aria-controls="mobileHeaderSearch"
        onClick={() => setOpen(!open)}
      >
        <Search size={21} aria-hidden="true" />
      </button>
      {open && (
        <div id="mobileHeaderSearch" className="ngc-mobile-search-panel">
          <form role="search" action="/catalog/" method="get">
            <Search size={18} aria-hidden="true" />
            <input
              ref={inputRef}
              name="q"
              type="search"
              minLength={2}
              placeholder="Search products..."
              aria-label="Search products"
              onKeyDown={event => {
                if (event.key === 'Escape') setOpen(false)
              }}
            />
            <button type="submit" aria-label="Submit product search">Search</button>
            <button type="button" aria-label="Close product search" onClick={() => setOpen(false)}>
              <X size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
