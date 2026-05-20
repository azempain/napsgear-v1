import { describe, it, expect } from 'vitest'
import { toWebpSource } from './imagePath'

describe('toWebpSource', () => {
  it('rewrites .jpg → .webp', () => {
    expect(toWebpSource('/images/products/foo.jpg')).toBe('/images/products/foo.webp')
  })
  it('rewrites .jpeg → .webp', () => {
    expect(toWebpSource('/images/products/foo.jpeg')).toBe('/images/products/foo.webp')
  })
  it('rewrites .png → .webp', () => {
    expect(toWebpSource('/img/bg_week-product.png')).toBe('/img/bg_week-product.webp')
  })
  it('is case-insensitive on the extension', () => {
    expect(toWebpSource('/foo/BAR.JPG')).toBe('/foo/BAR.webp')
  })
  it('returns null for already-webp', () => {
    expect(toWebpSource('/foo/bar.webp')).toBeNull()
  })
  it('returns null for SVG / GIF / unknown extensions', () => {
    expect(toWebpSource('/foo/bar.svg')).toBeNull()
    expect(toWebpSource('/foo/bar.gif')).toBeNull()
    expect(toWebpSource('/foo/bar')).toBeNull()
  })
  it('returns null for absolute external URLs (no companion emitted)', () => {
    expect(toWebpSource('https://cdn.example.com/img.jpg')).toBeNull()
    expect(toWebpSource('http://cdn.example.com/img.png')).toBeNull()
  })
  it('returns null for empty input', () => {
    expect(toWebpSource('')).toBeNull()
  })
})
