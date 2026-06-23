'use client'

import { Store } from '@tanstack/store'
import type { SortKey, LabelFilters } from '@/lib/productTable.helper'
import { EMPTY_LABEL_FILTERS } from '@/lib/productTable.helper'
import type { QaSort } from '@/lib/qa'

export type MobileDrawerSection = 'brands' | 'categories' | 'promotions' | 'information' | null
export type ProductTab = 'description' | 'reviews' | 'qa'

type AuthFormState = {
  name: string
  email: string
  password: string
  confirmPassword: string
  error: string
  message: string
  pending: boolean
  showPassword: boolean
  nextQuery: string
  captchaToken: string | null
}

type ProductTableState = {
  sourceKey: string
  search: string
  labels: LabelFilters
  ingredients: string[]
  sortKey: SortKey
}

type ComponentUiState = {
  authForm: AuthFormState
  cartToastVisible: boolean
  mobileDrawerExpanded: MobileDrawerSection
  productDetail: {
    slug: string
    selected: number
    tab: ProductTab
    toastVisible: boolean
  }
  productImageLoaded: Record<string, boolean>
  productQuickViewAdded: boolean
  productTable: ProductTableState
  qaForum: {
    category: string
    sort: QaSort
  }
}

const initialAuthForm: AuthFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  error: '',
  message: '',
  pending: false,
  showPassword: false,
  nextQuery: '',
  captchaToken: null,
}

const initialProductTable: ProductTableState = {
  sourceKey: '',
  search: '',
  labels: EMPTY_LABEL_FILTERS,
  ingredients: [],
  sortKey: 'name-asc',
}

const initialState: ComponentUiState = {
  authForm: initialAuthForm,
  cartToastVisible: false,
  mobileDrawerExpanded: null,
  productDetail: {
    slug: '',
    selected: 0,
    tab: 'description',
    toastVisible: false,
  },
  productImageLoaded: {},
  productQuickViewAdded: false,
  productTable: initialProductTable,
  qaForum: {
    category: 'All categories',
    sort: 'newest',
  },
}

export const componentUiStore = new Store(initialState, (store) => ({
  resetAuthForm() {
    store.setState(state => ({ ...state, authForm: initialAuthForm }))
  },
  setAuthField<K extends keyof AuthFormState>(field: K, value: AuthFormState[K]) {
    store.setState(state => ({
      ...state,
      authForm: { ...state.authForm, [field]: value },
    }))
  },
  clearAuthStatus() {
    store.setState(state => ({
      ...state,
      authForm: { ...state.authForm, error: '', message: '' },
    }))
  },
  setCartToastVisible(cartToastVisible: boolean) {
    store.setState(state => ({ ...state, cartToastVisible }))
  },
  toggleMobileDrawerSection(section: Exclude<MobileDrawerSection, null>) {
    store.setState(state => ({
      ...state,
      mobileDrawerExpanded: state.mobileDrawerExpanded === section ? null : section,
    }))
  },
  resetProductDetail(slug: string) {
    store.setState(state => ({
      ...state,
      productDetail: { slug, selected: 0, tab: 'description', toastVisible: false },
    }))
  },
  setProductPack(selected: number) {
    store.setState(state => ({
      ...state,
      productDetail: { ...state.productDetail, selected },
    }))
  },
  setProductTab(tab: ProductTab) {
    store.setState(state => ({
      ...state,
      productDetail: { ...state.productDetail, tab },
    }))
  },
  setProductToastVisible(toastVisible: boolean) {
    store.setState(state => ({
      ...state,
      productDetail: { ...state.productDetail, toastVisible },
    }))
  },
  markProductImageLoaded(src: string) {
    store.setState(state => ({
      ...state,
      productImageLoaded: { ...state.productImageLoaded, [src]: true },
    }))
  },
  setProductQuickViewAdded(productQuickViewAdded: boolean) {
    store.setState(state => ({ ...state, productQuickViewAdded }))
  },
  setProductSearch(search: string) {
    store.setState(state => ({
      ...state,
      productTable: { ...state.productTable, search },
    }))
  },
  hydrateProductTable(sourceKey: string, search: string) {
    store.setState(state => {
      if (state.productTable.sourceKey === sourceKey) return state
      return {
        ...state,
        productTable: {
          ...initialProductTable,
          sourceKey,
          search,
        },
      }
    })
  },
  setProductSort(sortKey: SortKey) {
    store.setState(state => ({
      ...state,
      productTable: { ...state.productTable, sortKey },
    }))
  },
  toggleProductLabel(name: keyof LabelFilters) {
    store.setState(state => ({
      ...state,
      productTable: {
        ...state.productTable,
        labels: { ...state.productTable.labels, [name]: !state.productTable.labels[name] },
      },
    }))
  },
  toggleProductIngredient(name: string) {
    store.setState(state => {
      const ingredients = state.productTable.ingredients.includes(name)
        ? state.productTable.ingredients.filter(item => item !== name)
        : [...state.productTable.ingredients, name]
      return {
        ...state,
        productTable: { ...state.productTable, ingredients },
      }
    })
  },
  resetProductTable() {
    store.setState(state => ({ ...state, productTable: initialProductTable }))
  },
  setQaCategory(category: string) {
    store.setState(state => ({ ...state, qaForum: { ...state.qaForum, category } }))
  },
  setQaSort(sort: QaSort) {
    store.setState(state => ({ ...state, qaForum: { ...state.qaForum, sort } }))
  },
}))
