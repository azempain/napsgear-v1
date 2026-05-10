import brandsJson    from './brands.json'
import categoriesJson from './categories.json'
import videosJson    from './videos.json'
import productsJson  from './products.json'
import qaPostsJson   from './qa-posts.json'
import gearpicsJson  from './gearpics.json'
import type { Brand, Category, Video, Product, QaPost, Gearpic } from './types'

export const brands:     Brand[]    = brandsJson    as Brand[]
export const categories: Category[] = categoriesJson as Category[]
export const videos:     Video[]    = videosJson    as Video[]
export const products:   Product[]  = productsJson  as Product[]
export const qaPosts:    QaPost[]   = qaPostsJson   as QaPost[]
export const gearpics:   Gearpic[]  = gearpicsJson  as Gearpic[]

export type { Brand, Category, Video, Product, QaPost, Gearpic }
