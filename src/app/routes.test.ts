import { describe, it, expect } from 'vitest'

describe('new route modules import cleanly', () => {
  it('references', async () => {
    expect((await import('./references/page')).default).toBeTypeOf('function')
  })
  it('promotions', async () => {
    expect((await import('./promotions/page')).default).toBeTypeOf('function')
  })
  it('help', async () => {
    expect((await import('./help/page')).default).toBeTypeOf('function')
  })
  it('shipping-information', async () => {
    expect((await import('./shipping-information/page')).default).toBeTypeOf('function')
  })
  it('qa', async () => {
    expect((await import('./qa/page')).default).toBeTypeOf('function')
  })
  it('cart', async () => {
    expect((await import('./cart/page')).default).toBeTypeOf('function')
  })
  it('brands/[slug]', async () => {
    expect((await import('./brands/[slug]/page')).default).toBeTypeOf('function')
  })
  it('account routes', async () => {
    expect((await import('./login/page')).default).toBeTypeOf('function')
    expect((await import('./signup/page')).default).toBeTypeOf('function')
    expect((await import('./account/page')).default).toBeTypeOf('function')
  })
  it('promotion and community routes', async () => {
    expect((await import('./store-credit/page')).default).toBeTypeOf('function')
    expect((await import('./product-of-the-week/page')).default).toBeTypeOf('function')
    expect((await import('./community-gearpics/page')).default).toBeTypeOf('function')
  })
})
