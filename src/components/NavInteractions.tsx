'use client'
import { useEffect } from 'react'
import { useStickyHeader } from '@/hooks/useStickyHeader'

/**
 * Replaces Bootstrap's data-API for the two behaviors the clone uses:
 *
 * 1. Dropdowns: [data-bs-toggle="dropdown"] click toggles `.show` on the
 *    target menu (data-bs-target) and `aria-expanded` on the button.
 *    `data-bs-parent` enforces accordion (only one open per parent).
 *    Closes on outside-click and Escape.
 *
 * 2. Modals: [data-bs-toggle="modal"] click shows the target `.modal`
 *    with a `.modal-backdrop`. Closes on backdrop-click, Escape, or
 *    [data-bs-dismiss="modal"]. Body scroll locked while open.
 *
 * Touches only the classes/attributes that main.css/globals.css already
 * style. Mount this component once anywhere inside the document — it uses
 * delegated listeners on document, so it has no DOM output of its own.
 */
export default function NavInteractions() {
  useStickyHeader()

  // Sync --header-h to the real rendered height of the fixed header so the
  // body's padding-top is always correct, even if the header gains a row or
  // a font swap changes its size. SSR ships static fallbacks in globals.css;
  // this just refines them once hydration finishes.
  useEffect(() => {
    const el = document.getElementById('header')
    if (!el) return
    const apply = () => {
      const h = el.offsetHeight
      if (h > 0) document.documentElement.style.setProperty('--header-h', `${h}px`)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    window.addEventListener('resize', apply)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [])

  useEffect(() => {
    // ── DROPDOWNS ────────────────────────────────────────────────────────
    function getMenuFor(button: Element): HTMLElement | null {
      // Bootstrap supports two patterns:
      //   (a) data-bs-target="#menuId"  → query that id
      //   (b) next-sibling within .dropdown parent → first sibling .dropdown-menu
      const target = button.getAttribute('data-bs-target')
      if (target) return document.querySelector<HTMLElement>(target)
      const parent = button.closest('.dropdown, .menu-item-dropdown') || button.parentElement
      return parent?.querySelector<HTMLElement>(':scope > .dropdown-menu') ?? null
    }

    function findTriggerForMenu(menu: HTMLElement): HTMLElement | null {
      // Reverse of getMenuFor: prefer matching by data-bs-target, fall back
      // to the sibling button within the same .dropdown parent.
      if (menu.id) {
        const byTarget = document.querySelector<HTMLElement>(`[data-bs-target="#${menu.id}"]`)
        if (byTarget) return byTarget
      }
      const parent = menu.closest('.dropdown, .menu-item-dropdown') || menu.parentElement
      return parent?.querySelector<HTMLElement>(':scope > [data-bs-toggle="dropdown"]') ?? null
    }

    function closeDropdownGroup(parentSelector: string | null, except?: HTMLElement) {
      const scope = parentSelector
        ? document.querySelector(parentSelector) ?? document
        : document
      scope.querySelectorAll<HTMLElement>('.dropdown-menu.show').forEach(menu => {
        if (menu === except) return
        menu.classList.remove('show')
        findTriggerForMenu(menu)?.setAttribute('aria-expanded', 'false')
      })
    }

    function closeAllDropdowns() {
      document.querySelectorAll<HTMLElement>('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show')
      })
      document
        .querySelectorAll<HTMLElement>('[data-bs-toggle="dropdown"][aria-expanded="true"]')
        .forEach(btn => btn.setAttribute('aria-expanded', 'false'))
    }

    function onDocClick(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return

      // Click on a dropdown trigger
      const trigger = target.closest<HTMLElement>('[data-bs-toggle="dropdown"]')
      if (trigger) {
        e.preventDefault()
        const menu = getMenuFor(trigger)
        if (!menu) return
        const willOpen = !menu.classList.contains('show')
        const parent = trigger.getAttribute('data-bs-parent')
        closeDropdownGroup(parent, willOpen ? menu : undefined)
        menu.classList.toggle('show', willOpen)
        trigger.setAttribute('aria-expanded', String(willOpen))
        return
      }

      // Click on a modal trigger
      const modalTrigger = target.closest<HTMLElement>('[data-bs-toggle="modal"]')
      if (modalTrigger) {
        e.preventDefault()
        const sel = modalTrigger.getAttribute('data-bs-target')
          || modalTrigger.getAttribute('href')
        if (!sel) return
        const modal = document.querySelector<HTMLElement>(sel)
        if (modal) openModal(modal)
        return
      }

      // Click on a modal dismiss
      const dismiss = target.closest<HTMLElement>('[data-bs-dismiss="modal"]')
      if (dismiss) {
        const modal = dismiss.closest<HTMLElement>('.modal')
        if (modal) closeModal(modal)
        return
      }

      // Click on a modal backdrop
      if (target.classList.contains('modal-backdrop')) {
        const openModalEl = document.querySelector<HTMLElement>('.modal.show')
        if (openModalEl) closeModal(openModalEl)
        return
      }

      // Outside-click on dropdowns: close any open ones if click was outside
      if (!target.closest('.dropdown-menu') && !target.closest('[data-bs-toggle="dropdown"]')) {
        closeAllDropdowns()
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      const openModalEl = document.querySelector<HTMLElement>('.modal.show')
      if (openModalEl) { closeModal(openModalEl); return }
      closeAllDropdowns()
    }

    // ── MODALS ───────────────────────────────────────────────────────────
    function openModal(modal: HTMLElement) {
      if (modal.classList.contains('show')) return
      modal.classList.add('show')
      modal.style.display = 'block'
      modal.setAttribute('aria-hidden', 'false')
      modal.removeAttribute('inert')

      const backdrop = document.createElement('div')
      backdrop.className = 'modal-backdrop fade show'
      backdrop.setAttribute('data-nav-modal-backdrop', '')
      document.body.appendChild(backdrop)

      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-open')
    }

    function closeModal(modal: HTMLElement) {
      modal.classList.remove('show')
      modal.style.display = ''
      modal.setAttribute('aria-hidden', 'true')

      document
        .querySelectorAll('[data-nav-modal-backdrop]')
        .forEach(el => el.remove())

      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
    }

    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return null
}
