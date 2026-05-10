import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('drops undefined and null', () => {
    expect(cn('foo', undefined, null as unknown as undefined, 'bar')).toBe('foo bar')
  })

  it('merges conflicting Tailwind classes — last wins', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6')
  })

  it('handles conditional object syntax', () => {
    expect(cn('base', { active: true, inactive: false })).toBe('base active')
  })

  it('returns empty string with no inputs', () => {
    expect(cn()).toBe('')
  })
})
