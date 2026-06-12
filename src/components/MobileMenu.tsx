'use client'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import MobileDrawer from './MobileDrawer'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label="Open navigation"
          aria-expanded={open ? 'true' : 'false'}
          aria-controls="mobileDrawer"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </SheetTrigger>
      <MobileDrawer onClose={() => setOpen(false)} />
    </Sheet>
  )
}
