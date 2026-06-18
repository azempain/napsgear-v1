// Minimal shapes for the fields we consume from the ninegear.us
// WooCommerce Store API (GET /wp-json/wc/store/v1/products).
export interface NinegearImage {
  src: string
}

export interface NinegearCategory {
  id: number
  name: string
  slug: string
}

export interface NinegearProduct {
  id: number
  name: string
  slug: string
  prices: { price: string }
  on_sale: boolean
  short_description: string
  images: NinegearImage[]
  categories: NinegearCategory[]
}
