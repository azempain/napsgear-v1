import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and hyphenates non-alphanumerics', () => {
    expect(slugify('Alpha-Pharma Healthcare')).toBe('alpha-pharma-healthcare')
    expect(slugify('Euro – Pharmacies')).toBe('euro-pharmacies')
  })

  it('collapses separator runs and trims edge hyphens', () => {
    expect(slugify('  CROWX   LABS!! ')).toBe('crowx-labs')
    expect(slugify('***Anavar***')).toBe('anavar')
  })

  it('returns empty string for separator-only input', () => {
    expect(slugify('!!!')).toBe('')
  })
})
