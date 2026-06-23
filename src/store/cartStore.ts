'use client'

import { Store } from '@tanstack/store'

export interface CartItem {
  id: string
  productName: string
  packCount: number
  packLabel?: string
  price: number
  qty: number
  image?: string
  brand?: string
  slug: string
}

export interface CartState {
  items: CartItem[]
  hydrated: boolean
}

export const CART_STORAGE_KEY = 'napsgear_cart'

const initialState: CartState = {
  items: [],
  hydrated: false,
}

export function migrateItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.productName === 'string' && typeof o.packCount === 'number') {
    return o as unknown as CartItem
  }
  if (typeof o.name === 'string' && typeof o.price === 'number' && typeof o.qty === 'number') {
    const id = typeof o.id === 'string' ? o.id : ''
    return {
      id,
      productName: o.name,
      packCount: 1,
      slug: id.split('__')[0] || '',
      price: o.price,
      qty: o.qty,
      image: typeof o.image === 'string' ? o.image : undefined,
      brand: typeof o.brand === 'string' ? o.brand : undefined,
    }
  }
  return null
}

export const cartStore = new Store(initialState, (store) => ({
  hydrate(items: CartItem[]) {
    store.setState(() => ({ items, hydrated: true }))
  },
  markHydrated() {
    store.setState(state => ({ ...state, hydrated: true }))
  },
  addItem(item: CartItem) {
    if (item.qty <= 0) return
    store.setState(state => {
      const existing = state.items.find(i => i.id === item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i => i.id === item.id ? { ...i, qty: i.qty + item.qty } : i),
        }
      }
      return { ...state, items: [...state.items, item] }
    })
  },
  removeItem(id: string) {
    store.setState(state => ({ ...state, items: state.items.filter(i => i.id !== id) }))
  },
  updateQty(id: string, qty: number) {
    store.setState(state => ({
      ...state,
      items: qty <= 0
        ? state.items.filter(i => i.id !== id)
        : state.items.map(i => i.id === id ? { ...i, qty } : i),
    }))
  },
  clearCart() {
    store.setState(state => ({ ...state, items: [] }))
  },
}))

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.qty, 0)
}
