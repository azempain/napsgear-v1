'use client'

import { Store } from '@tanstack/store'
import { useStore } from '@tanstack/react-store'

type AppUiState = {
  mobileNavOpen: boolean
  mobileAccountOpen: boolean
  mobileSearchOpen: boolean
}

type AppUiActions = {
  setMobileNavOpen: (open: boolean) => void
  setMobileAccountOpen: (open: boolean) => void
  setMobileSearchOpen: (open: boolean) => void
  closeMobileSheets: () => void
}

const initialState: AppUiState = {
  mobileNavOpen: false,
  mobileAccountOpen: false,
  mobileSearchOpen: false,
}

export const appUiStore = new Store(initialState, (store): AppUiActions => ({
  setMobileNavOpen(mobileNavOpen) {
    store.setState(state => ({ ...state, mobileNavOpen }))
  },
  setMobileAccountOpen(mobileAccountOpen) {
    store.setState(state => ({ ...state, mobileAccountOpen }))
  },
  setMobileSearchOpen(mobileSearchOpen) {
    store.setState(state => ({ ...state, mobileSearchOpen }))
  },
  closeMobileSheets() {
    store.setState(() => initialState)
  },
}))

export function useAppUiStore<T>(selector: (state: AppUiState & AppUiActions) => T): T {
  const state = useStore(appUiStore)
  return selector({ ...state, ...appUiStore.actions })
}
