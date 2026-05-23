import { describe, it, expect } from 'vitest'
import { sanitize } from './sanitize'

describe('sanitize', () => {
  it('keeps allowed tags', () => {
    const out = sanitize('<p>hi</p><h2>x</h2><ul><li>a</li></ul>')
    expect(out).toBe('<p>hi</p><h2>x</h2><ul><li>a</li></ul>')
  })

  it('strips script tags entirely (including contents)', () => {
    expect(sanitize('<p>ok</p><script>alert(1)</script>')).toBe('<p>ok</p>')
  })

  it('strips disallowed tags but keeps their text content', () => {
    expect(sanitize('<div><p>hi</p></div>')).toBe('<p>hi</p>')
  })

  it('strips disallowed attributes (onclick, target, class, data-*)', () => {
    expect(sanitize('<a href="/x" target="_blank" onclick="x()" class="c">link</a>'))
      .toBe('<a href="/x">link</a>')
  })

  it('rewrites absolute napsgear.org URLs to relative', () => {
    expect(sanitize('<a href="https://www.napsgear.org/products/x/">x</a>'))
      .toBe('<a href="/products/x/">x</a>')
  })

  it('drops non-https external hrefs', () => {
    expect(sanitize('<a href="javascript:alert(1)">x</a>'))
      .toBe('<a>x</a>')
    expect(sanitize('<a href="http://evil.example/">x</a>'))
      .toBe('<a>x</a>')
  })

  it('drops img with non-local src', () => {
    expect(sanitize('<img src="https://evil.example/x.jpg" alt="x">'))
      .toBe('')
  })

  it('keeps img with local /images/... src', () => {
    expect(sanitize('<img src="/images/diaries/d1/01.jpg" alt="x">'))
      .toBe('<img src="/images/diaries/d1/01.jpg" alt="x">')
  })
})
