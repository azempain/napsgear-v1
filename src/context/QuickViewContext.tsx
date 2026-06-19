'use client'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '@/data/types'
import ProductQuickView from '@/components/ProductQuickView'

interface QuickViewValue {
  // null when no provider is mounted → consumers fall back to their <a href>.
  open: ((product: Product) => void) | null
}

const QuickViewContext = createContext<QuickViewValue>({ open: null })

export function useQuickView(): QuickViewValue {
  return useContext(QuickViewContext)
}

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null)
  const open = useCallback((p: Product) => setProduct(p), [])
  const value = useMemo<QuickViewValue>(() => ({ open }), [open])

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <ProductQuickView
        product={product}
        open={product !== null}
        onOpenChange={(o) => { if (!o) setProduct(null) }}
      />
    </QuickViewContext.Provider>
  )
}
