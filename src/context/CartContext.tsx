'use client'
import {
  createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode,
} from 'react'

export interface CartItem {
  id: string            // `${slug}__${packCount}`
  productName: string
  packCount: number
  packLabel?: string
  price: number
  qty: number
  image?: string
  brand?: string
  slug: string
}

// Map a possibly-legacy persisted entry to the structured shape.
function migrateItem(raw: unknown): CartItem | null {
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

const STORAGE_KEY = 'napsgear_cart'

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setItems(parsed.map(migrateItem).filter((x): x is CartItem => x !== null))
        }
      }
    } catch {
      /* corrupt storage — start empty */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* quota / privacy mode — ignore, cart still works in-memory */
    }
  }, [items, hydrated])

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])

  const addItem = useCallback((item: CartItem) => {
    if (item.qty <= 0) return
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + item.qty } : i)
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.id !== id))
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(
    () => ({ items, count, hydrated, addItem, removeItem, updateQty, clearCart }),
    [items, count, hydrated, addItem, removeItem, updateQty, clearCart],
  )

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
