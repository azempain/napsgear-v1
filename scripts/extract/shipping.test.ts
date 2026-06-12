import { describe, it, expect } from 'vitest'
import { extractShipping } from './shipping'

// Fixture mirrors the actual page: legal terms appear first, while the real
// shipping copy lives in the main table after the accordion.
const HTML = `
<html><body>
  <main>
    <div class="accordion"><h4>DISCLAIMER OF WARRANTY:</h4><p>Not shipping copy.</p></div>
    <table><tr><td class="main">
      Shipping overview copy.
      <br><br><b>First Class Shipping</b> fees cover handling and courier service.
      <br><br><b>Domestic Orders</b><br><br>Domestic delivery guidance.
      <br><br><b>International Orders</b><br><br>International delivery guidance.
      <br><br><i>Customs Clearance: Higher-risk destinations have different policies.</i>
    </td></tr></table>
  </main>
</body></html>
`

describe('extractShipping', () => {
  const doc = extractShipping(HTML)

  it('extracts the shipping policy rather than the legal accordion', () => {
    expect(doc.sections.map(s => s.heading)).toEqual([
      'Shipping overview',
      'First Class Shipping',
      'Domestic Orders',
      'International Orders',
      'Customs Clearance',
    ])
  })

  it('captures the text under each shipping heading', () => {
    expect(doc.sections[0].paras).toEqual(['Shipping overview copy.'])
    expect(doc.sections[2].paras).toEqual(['Domestic delivery guidance.'])
    expect(doc.sections[4].paras).toEqual(['Higher-risk destinations have different policies.'])
  })

  it('returns no sections when the policy table is absent', () => {
    expect(extractShipping('<html><body><h4>Terms</h4></body></html>')).toEqual({ sections: [] })
  })
})
