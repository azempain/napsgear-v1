'use client'
import { useEffect } from 'react'
import { shouldFix } from '@/lib/sticky'

const THRESHOLD = 80

/**
 * Toggles `.fixed` on `.header-middle.sticky-header` past the scroll
 * threshold. main.css already styles `.sticky-header.fixed` (position:fixed
 * + shadow + animation). Also adds `body.has-sticky-header` and a
 * `--sticky-h` CSS var so a globals.css rule can reserve space and avoid
 * layout jump.
 */
export function useStickyHeader() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.header-middle.sticky-header')
    if (!el) return
    const apply = (on: boolean) => {
      el.classList.toggle('fixed', on)
      document.body.classList.toggle('has-sticky-header', on)
      if (on && !document.body.style.getPropertyValue('--sticky-h')) {
        document.body.style.setProperty('--sticky-h', el.offsetHeight + 'px')
      }
    }
    const onScroll = () => apply(shouldFix(window.scrollY, THRESHOLD))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      apply(false)
      document.body.style.removeProperty('--sticky-h')
    }
  }, [])
}
