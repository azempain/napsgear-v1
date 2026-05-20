import { describe, it, expect } from 'vitest'
import { SITE_URL, absoluteUrl, STATIC_ROUTES, PRIVATE_ROUTES } from './site'

describe('SITE_URL', () => {
  it('has no trailing slash', () => {
    expect(SITE_URL.endsWith('/')).toBe(false)
  })
  it('starts with https://', () => {
    expect(SITE_URL.startsWith('https://')).toBe(true)
  })
})

describe('absoluteUrl', () => {
  it('prepends SITE_URL when path has a leading slash', () => {
    expect(absoluteUrl('/catalog/')).toBe(`${SITE_URL}/catalog/`)
  })
  it('adds a leading slash when the path is missing one', () => {
    expect(absoluteUrl('catalog/')).toBe(`${SITE_URL}/catalog/`)
  })
  it('keeps the trailing slash on subpaths', () => {
    expect(absoluteUrl('/brands/alpha-pharma/')).toBe(`${SITE_URL}/brands/alpha-pharma/`)
  })
})

describe('STATIC_ROUTES', () => {
  it('has no duplicate paths', () => {
    const paths = STATIC_ROUTES.map(r => r.path)
    expect(new Set(paths).size).toBe(paths.length)
  })
  it('every priority is 0..1', () => {
    for (const r of STATIC_ROUTES) {
      expect(r.priority).toBeGreaterThan(0)
      expect(r.priority).toBeLessThanOrEqual(1)
    }
  })
  it('homepage has priority 1.0', () => {
    const home = STATIC_ROUTES.find(r => r.path === '/')
    expect(home?.priority).toBe(1.0)
  })
  it('does not include private routes (cart, checkout)', () => {
    const paths = STATIC_ROUTES.map(r => r.path)
    for (const p of PRIVATE_ROUTES) expect(paths).not.toContain(p)
  })
})
