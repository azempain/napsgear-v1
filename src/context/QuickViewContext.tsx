'use client'
import { type ReactNode } from 'react'
import { useStore } from '@tanstack/react-store'
import type { Product } from '@/data/types'
import ProductQuickView from '@/components/ProductQuickView'
import { quickViewStore } from '@/store/quickViewStore'

interface QuickViewValue {
  // null when no provider is mounted → consumers fall back to their <a href>.
  open: ((product: Product) => void) | null
}

export function useQuickView(): QuickViewValue {
  return { open: quickViewStore.actions.open }
}

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const product = useStore(quickViewStore, state => state.product)

  return (
    <>
      {children}
      <ProductQuickView
        product={product}
        open={product !== null}
        onOpenChange={quickViewStore.actions.setOpen}
      />
    </>
  )
}
