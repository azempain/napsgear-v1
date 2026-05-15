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

export interface Product {
  slug: string
  name: string
  description: string
  images: string[]
  price?: string
  brand?: string
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
