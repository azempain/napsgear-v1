import { describe, it, expect } from 'vitest'
import { extractShipping } from './shipping'

// Fixture mirrors the actual shipping page: a series of <h4> headings each
// followed by one or more <p> paragraphs (no <ul> lists in this corpus).
const HTML = `
<html><body>
  <h1>Shipping &amp; Returns</h1>

  <h4>DISCLAIMER OF WARRANTY:</h4>
  <p>napsgear.org expressly disclaims warranties of any kind.</p>
  <p>Second paragraph here.</p>

  <h4>LIMITATION OF LIABILITY:</h4>
  <p>In no event will we be liable for any damages.</p>

  <h3 class="alignTextCenter">Purchasing and Ordering Disclaimer</h3>

  <h4>MAKE YOUR OWN DECISIONS:</h4>
  <p>If you are making important purchasing or planning decisions ...</p>
  <ul><li>Item one</li><li>Item two</li></ul>
</body></html>
`

describe('extractShipping', () => {
  const doc = extractShipping(HTML)

  it('one section per <h4> heading', () => {
    expect(doc.sections.map(s => s.heading)).toEqual([
      'DISCLAIMER OF WARRANTY:',
      'LIMITATION OF LIABILITY:',
      'MAKE YOUR OWN DECISIONS:',
    ])
  })

  it('captures all paras under a section until the next heading', () => {
    expect(doc.sections[0].paras).toEqual([
      'napsgear.org expressly disclaims warranties of any kind.',
      'Second paragraph here.',
    ])
    expect(doc.sections[1].paras).toEqual([
      'In no event will we be liable for any damages.',
    ])
  })

  it('captures <ul><li> as the list field when present', () => {
    expect(doc.sections[2].list).toEqual(['Item one', 'Item two'])
  })

  it('omits paras/list fields when empty', () => {
    const empty = extractShipping('<html><body><h4>Empty</h4></body></html>')
    expect(empty.sections[0].paras).toBeUndefined()
    expect(empty.sections[0].list).toBeUndefined()
  })
})
