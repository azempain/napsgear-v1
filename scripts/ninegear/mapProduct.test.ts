import { describe, it, expect } from 'vitest'
import { mapProduct } from './mapProduct'
import type { NinegearProduct } from './types'

const WITH_SPEC: NinegearProduct = {
  id: 5492,
  name: 'BPC-157',
  slug: 'bpc-157-2',
  prices: { price: '110' },
  on_sale: false,
  short_description:
    '<table><tbody><tr><td><b>Brands</b></td><td>Pharmaqo Labs</td></tr>' +
    '<tr><td><b>Shipped from</b></td><td>USA</td></tr></tbody></table>',
  images: [{ src: 'https://ninegear.us/wp-content/uploads/2025/10/bpc-157-pharmaqo-labs.jpg' }],
  categories: [{ id: 156, name: 'Peptides', slug: 'peptides' }],
}

const BARE: NinegearProduct = {
  id: 9001,
  name: 'Anavar 10',
  slug: 'anavar-10',
  prices: { price: '85' },
  on_sale: true,
  short_description: '',
  images: [
    { src: 'https://ninegear.us/wp-content/uploads/x/anavar-a.png' },
    { src: 'https://ninegear.us/wp-content/uploads/x/anavar-a.png' }, // dup
    { src: 'https://ninegear.us/wp-content/uploads/x/anavar-b.png' },
  ],
  categories: [{ id: 148, name: 'Anavar', slug: 'anavar' }],
}

describe('mapProduct', () => {
  it('maps core fields and prefixes price with $', () => {
    const { product } = mapProduct(WITH_SPEC)
    expect(product.slug).toBe('bpc-157-2')
    expect(product.name).toBe('BPC-157')
    expect(product.price).toBe('$110')
    expect(product.brand).toBe('Pharmaqo Labs')
    expect(product.packs).toBeUndefined()
    expect(product.labels).toBeUndefined()
  })

  it('renders the spec table into the description', () => {
    const { product } = mapProduct(WITH_SPEC)
    expect(product.description).toContain('Pharmaqo Labs')
    expect(product.description).toContain('Shipped from')
  })

  it('maps images to local paths and dedupes by remote src', () => {
    const { product, images } = mapProduct(BARE)
    expect(product.images).toEqual([
      '/images/products/anavar-10-1.png',
      '/images/products/anavar-10-2.png',
    ])
    expect(images).toEqual([
      { remote: 'https://ninegear.us/wp-content/uploads/x/anavar-a.png', local: '/images/products/anavar-10-1.png' },
      { remote: 'https://ninegear.us/wp-content/uploads/x/anavar-b.png', local: '/images/products/anavar-10-2.png' },
    ])
  })

  it('filters out theme junk images (flags, default placeholders, icons)', () => {
    const np: NinegearProduct = {
      id: 7,
      name: 'HCGrow',
      slug: 'hcgrow-2',
      prices: { price: '60' },
      on_sale: false,
      short_description: '',
      images: [
        { src: 'https://ninegear.us/wp-content/uploads/2025/10/hcgrow-crowx-labs.jpg' },
        { src: 'https://ninegear.us/wp-content/uploads/2025/10/en-default-medium_default.webp' },
        { src: 'https://ninegear.us/wp-content/uploads/2025/10/us-flag.png' },
        { src: 'https://ninegear.us/wp-content/uploads/2025/10/int-flag.png' },
        { src: 'https://ninegear.us/wp-content/uploads/2025/10/uk-flag1.png' },
        { src: 'https://ninegear.us/wp-content/uploads/2025/10/test-icon-min2.png' },
      ],
      categories: [{ id: 156, name: 'Peptides', slug: 'peptides' }],
    }
    const { product, images } = mapProduct(np)
    expect(product.images).toEqual(['/images/products/hcgrow-2-1.jpg'])
    expect(images).toHaveLength(1)
  })

  it('uses a templated description and Sale label when bare + on_sale', () => {
    const { product } = mapProduct(BARE)
    expect(product.brand).toBeUndefined()
    expect(product.description).toContain('Anavar 10')
    expect(product.description.toLowerCase()).toContain('anavar')
    expect(product.labels).toEqual({ sale: 'Sale' })
  })
})
