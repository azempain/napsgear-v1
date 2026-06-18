import { describe, it, expect } from 'vitest'
import { buildProductsUrl } from './api'

describe('buildProductsUrl', () => {
  it('builds a Store-API URL with paging', () => {
    expect(buildProductsUrl(1)).toBe(
      'https://ninegear.us/wp-json/wc/store/v1/products?per_page=100&page=1',
    )
    expect(buildProductsUrl(3, 50)).toBe(
      'https://ninegear.us/wp-json/wc/store/v1/products?per_page=50&page=3',
    )
  })
})
