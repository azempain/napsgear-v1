import { describe, it, expect, vi } from 'vitest'
import { resetScroll } from './scrollToTop.helper'

describe('resetScroll', () => {
  it('scrolls to (0, 0) with instant behavior when there is no hash', () => {
    const scrollTo = vi.fn()
    resetScroll('', scrollTo)
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' })
  })

  it('does NOT scroll when the URL has a hash so anchor links still work', () => {
    const scrollTo = vi.fn()
    resetScroll('#description', scrollTo)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('treats a bare # as a hash and skips (matches browser behavior)', () => {
    const scrollTo = vi.fn()
    resetScroll('#', scrollTo)
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
