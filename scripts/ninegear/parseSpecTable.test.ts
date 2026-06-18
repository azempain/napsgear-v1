import { describe, it, expect } from 'vitest'
import { parseSpecTable } from './parseSpecTable'

const SPEC_HTML = `<table class="table table-bordered"><tbody>
<tr><td><b>Brands</b></td><td>Pharmaqo Labs</td></tr>
<tr><td><b>Shipped from</b></td><td>USA</td></tr>
<tr><td><b>Can&#8217;t ship to</b></td><td>Outside the USA</td></tr>
<tr><td><b>Regular Shipping Cost</b></td><td>$20</td></tr>
</tbody></table>`

describe('parseSpecTable', () => {
  it('extracts the brand from the Brands row', () => {
    expect(parseSpecTable(SPEC_HTML).brand).toBe('Pharmaqo Labs')
  })

  it('collects all rows and decodes entities', () => {
    const { fields } = parseSpecTable(SPEC_HTML)
    expect(fields['Shipped from']).toBe('USA')
    expect(fields['Can’t ship to']).toBe('Outside the USA')
    expect(fields['Regular Shipping Cost']).toBe('$20')
  })

  it('returns empty fields and no brand for empty input', () => {
    expect(parseSpecTable('')).toEqual({ fields: {} })
    expect(parseSpecTable('<p>no table here</p>')).toEqual({ fields: {} })
  })
})
