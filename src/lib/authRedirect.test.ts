import { describe, expect, it } from 'vitest'
import { authHref, safeAuthRedirect } from './authRedirect'

describe('safeAuthRedirect', () => {
  it('accepts local paths', () => {
    expect(safeAuthRedirect('?next=%2Fcheckout%2F')).toBe('/checkout/')
  })

  it('rejects external and protocol-relative URLs', () => {
    expect(safeAuthRedirect('?next=https%3A%2F%2Fevil.example')).toBe('/account/')
    expect(safeAuthRedirect('?next=%2F%2Fevil.example')).toBe('/account/')
  })
})

describe('authHref', () => {
  it('preserves the intended destination', () => {
    expect(authHref('/login/')).toBe('/login/?next=%2Fcheckout%2F')
  })
})
