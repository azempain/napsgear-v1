export interface Brand {
  slug: string | null
  name: string
  id: number | null
  url: string
}

export interface Category {
  slug: string
  name: string
  url: string
}

export interface Video {
  url: string
  title: string
  date: string
  thumbnail: string
  isPremiere?: boolean
  premiereDate?: string
  description?: string
}

export interface PackTier {
  packs: number
  label?: string        // e.g. "50 tabs (20mg/tab)" — present only for real captured data
  perItem: number
  total: number
}

export interface Review {
  rating: number   // 1–5
  author: string
  date: string
  body: string
}

export interface Product {
  slug: string
  name: string
  description: string
  images: string[]
  price?: string
  brand?: string
  ingredient?: string
  labels?: { new?: boolean; sale?: string }
  reviews?: number
  imagesCount?: number
  qaCount?: number
  packs?: PackTier[]
}

export interface QaPost {
  id: string
  date: string
  text: string
  url: string
  category?: string
  author?: string
}

export interface Gearpic {
  id: string
  date: string
  title: string
  thumb: string
}

export interface Ingredient {
  id: number
  name: string
  count: number
  brand: string
}
