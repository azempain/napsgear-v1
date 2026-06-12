import { create } from 'zustand'

interface AppUiState {
  mobileNavOpen: boolean
  mobileAccountOpen: boolean
  mobileSearchOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  setMobileAccountOpen: (open: boolean) => void
  setMobileSearchOpen: (open: boolean) => void
  closeMobileSheets: () => void
}

export const useAppUiStore = create<AppUiState>(set => ({
  mobileNavOpen: false,
  mobileAccountOpen: false,
  mobileSearchOpen: false,
  setMobileNavOpen: mobileNavOpen => set({ mobileNavOpen }),
  setMobileAccountOpen: mobileAccountOpen => set({ mobileAccountOpen }),
  setMobileSearchOpen: mobileSearchOpen => set({ mobileSearchOpen }),
  closeMobileSheets: () => set({
    mobileNavOpen: false,
    mobileAccountOpen: false,
    mobileSearchOpen: false,
  }),
}))
