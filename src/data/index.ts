import brandsJson    from './brands.json'
import categoriesJson from './categories.json'
import videosJson    from './videos.json'
import productsJson  from './products.json'
import qaPostsJson   from './qa-posts.json'
import gearpicsJson  from './gearpics.json'
import ingredientsJson from './ingredients.json'
import type { Brand, Category, Video, Product, QaPost, Gearpic, Ingredient } from './types'

export const brands:      Brand[]      = brandsJson      as Brand[]
export const categories:  Category[]   = categoriesJson  as Category[]
export const videos:      Video[]      = videosJson      as Video[]
export const products:    Product[]    = productsJson    as Product[]
/** O(1) product lookup by slug — avoids repeated Array.find() in dynamic routes. */
export const productsBySlug: Map<string, Product> = new Map(
  (productsJson as Product[]).map(p => [p.slug, p]),
)
export const qaPosts:     QaPost[]     = qaPostsJson     as QaPost[]
export const gearpics:    Gearpic[]    = gearpicsJson    as Gearpic[]
export const ingredients: Ingredient[] = ingredientsJson as Ingredient[]

export type {
  Brand, Category, Video, Product, QaPost, Gearpic, Ingredient,
  FaqEntry, ShippingDoc, Promotion, DiaryEntry, AffiliateDoc, ContactInfo,
  PackTier, Review, QAItem,
} from './types'
