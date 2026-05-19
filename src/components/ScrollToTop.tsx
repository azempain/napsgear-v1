'use client'
// Resets viewport scroll on every App Router pathname change so navigations
// always land at the top of the new page — including same-pathname pushes
// (e.g. router.push('/catalog/') from the checkout-success effect) where
// Next's built-in restoration would otherwise leave the previous scrollY.
//
// In-page anchor links are honored: if the new URL has a hash we skip the
// reset and let the browser jump to the target.

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { resetScroll } from './scrollToTop.helper'

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    resetScroll(window.location.hash, window.scrollTo.bind(window))
  }, [pathname])

  return null
}
