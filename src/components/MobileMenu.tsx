'use client'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import MobileDrawer from './MobileDrawer'

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobileDrawer"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} aria-hidden="true" />
      </button>
      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
