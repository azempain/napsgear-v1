// Open WooCommerce Store API client for ninegear.us. No auth, no Cloudflare.
import type { NinegearProduct } from './types'

const BASE = 'https://ninegear.us/wp-json/wc/store/v1/products'

/** Shared desktop UA for every ninegear.us request (JSON + image fetches), so
 *  the spoofed client string can't drift between modules. */
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export function buildProductsUrl(page: number, perPage = 100): string {
  return `${BASE}?per_page=${perPage}&page=${page}`
}

async function getJson<T>(url: string, attempt = 1): Promise<T> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return (await res.json()) as T
  } catch (err) {
    if (attempt >= 3) throw err
    await new Promise((r) => setTimeout(r, 500 * attempt))
    return getJson<T>(url, attempt + 1)
  }
}

/** Page through the products endpoint until a short page signals the end. */
export async function fetchAllProducts(perPage = 100): Promise<NinegearProduct[]> {
  const all: NinegearProduct[] = []
  for (let page = 1; page <= 50; page++) {
    const batch = await getJson<NinegearProduct[]>(buildProductsUrl(page, perPage))
    all.push(...batch)
    if (batch.length < perPage) break
  }
  if (all.length < 500) {
    throw new Error(`Expected ~691 products, got ${all.length} — aborting (API drift?)`)
  }
  return all
}
