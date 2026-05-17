'use client'
import {
  createContext, useContext, useState, useCallback, useEffect, type ReactNode,
} from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  image?: string
  brand?: string
}

export interface CartContextValue {
  items: CartItem[]
  count: number
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
        if (Array.isArray(parsed)) setItems(parsed as CartItem[])
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

  const count = items.reduce((sum, i) => sum + i.qty, 0)

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

  return (
    <CartContext.Provider value={{ items, count, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}
