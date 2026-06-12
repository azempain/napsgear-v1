'use client'
import { Menu } from 'lucide-react'
import MobileDrawer from './MobileDrawer'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { useAppUiStore } from '@/store/appUiStore'

export default function MobileMenu() {
  const open = useAppUiStore(state => state.mobileNavOpen)
  const setOpen = useAppUiStore(state => state.setMobileNavOpen)
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
