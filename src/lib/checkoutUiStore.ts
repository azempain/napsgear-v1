import { Store } from '@tanstack/store'
import type { CheckoutForm } from './checkout'

export type CheckoutStatus = 'form' | 'success'

export type CheckoutSnapshot = {
  count: number
  total: string
  email: string
  reference: string
  persistenceWarning?: string
}

type CheckoutUiState = {
  status: CheckoutStatus
  captchaToken: string | null
  captchaError: string
  formError: string
  snapshot: CheckoutSnapshot | null
  reference: string | null
}

const initialState: CheckoutUiState = {
  status: 'form',
  captchaToken: null,
  captchaError: '',
  formError: '',
  snapshot: null,
  reference: null,
}

export const checkoutUiStore = new Store(initialState, (store) => ({
  reset() {
    store.setState(() => initialState)
  },
  setCaptchaToken(token: string | null) {
    store.setState(state => ({
      ...state,
      captchaToken: token,
      captchaError: token ? '' : state.captchaError,
    }))
  },
  setCaptchaError(captchaError: string) {
    store.setState(state => ({ ...state, captchaError }))
  },
  setFormError(formError: string) {
    store.setState(state => ({ ...state, formError }))
  },
  setReference(reference: string | null) {
    store.setState(state => ({ ...state, reference }))
  },
  complete(snapshot: CheckoutSnapshot) {
    store.setState(state => ({
      ...state,
      status: 'success',
      snapshot,
      captchaError: '',
      formError: '',
      captchaToken: null,
      reference: null,
    }))
  },
}))

export function checkoutDefaultsFromSession(session?: { user?: { name?: string | null; email?: string | null } } | null): CheckoutForm {
  return {
    fullName: session?.user?.name ?? '',
    email: session?.user?.email ?? '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    notes: '',
  }
}
