import { describe, it, expect } from 'vitest'
import { shouldFix } from './sticky'

describe('shouldFix', () => {
  it('false at scrollY 0', () => {
    expect(shouldFix(0, 80)).toBe(false)
  })
  it('false at the threshold (strict greater-than)', () => {
    expect(shouldFix(80, 80)).toBe(false)
  })
  it('true past the threshold', () => {
    expect(shouldFix(81, 80)).toBe(true)
    expect(shouldFix(9999, 80)).toBe(true)
  })
  it('treats negative scrollY (rubber-band on iOS) as false', () => {
    expect(shouldFix(-50, 80)).toBe(false)
  })
})
