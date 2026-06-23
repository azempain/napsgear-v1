'use client'

import { Store } from '@tanstack/store'
import type { Product } from '@/data/types'

export const quickViewStore = new Store({ product: null as Product | null }, (store) => ({
  open(product: Product) {
    store.setState(() => ({ product }))
  },
  close() {
    store.setState(() => ({ product: null }))
  },
  setOpen(open: boolean) {
    if (!open) store.setState(() => ({ product: null }))
  },
}))
