'use client'
import { useEffect, type ReactNode } from 'react'
import { useStore } from '@tanstack/react-store'
import { CART_STORAGE_KEY, cartCount, cartStore, migrateItem, type CartItem } from '@/store/cartStore'

export type { CartItem } from '@/store/cartStore'

export interface CartContextValue {
  items: CartItem[]
  count: number
  /** False on first render of every page, true after localStorage has been
   *  read. Consumers use this to render skeletons instead of "0 items" while
   *  the persisted cart is being rehydrated. */
  hydrated: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
}

export function useCart(): CartContextValue {
  const state = useStore(cartStore)
  return {
    items: state.items,
    count: cartCount(state.items),
    hydrated: state.hydrated,
    addItem: cartStore.actions.addItem,
    removeItem: cartStore.actions.removeItem,
    updateQty: cartStore.actions.updateQty,
    clearCart: cartStore.actions.clearCart,
  }
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const { items, hydrated } = useStore(cartStore)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          cartStore.actions.hydrate(parsed.map(migrateItem).filter((x): x is CartItem => x !== null))
          return
        }
      }
    } catch {
      /* corrupt storage — start empty */
    }
    cartStore.actions.markHydrated()
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* quota / privacy mode — ignore, cart still works in-memory */
    }
  }, [items, hydrated])

  return children
}
