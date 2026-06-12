import { create } from 'zustand'

interface AppUiState {
  mobileNavOpen: boolean
  mobileAccountOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  setMobileAccountOpen: (open: boolean) => void
  closeMobileSheets: () => void
}

export const useAppUiStore = create<AppUiState>(set => ({
  mobileNavOpen: false,
  mobileAccountOpen: false,
  setMobileNavOpen: mobileNavOpen => set({ mobileNavOpen }),
  setMobileAccountOpen: mobileAccountOpen => set({ mobileAccountOpen }),
  closeMobileSheets: () => set({
    mobileNavOpen: false,
    mobileAccountOpen: false,
  }),
}))
