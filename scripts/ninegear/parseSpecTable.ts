// Pure parser for a ninegear product's `short_description`, which is a
// WooCommerce "spec table": <tr><td><b>Label</b></td><td>Value</td></tr>.
// cheerio decodes HTML entities (&#8217; -> ') when reading .text().
import { load } from 'cheerio'

export interface SpecTable {
  brand?: string
  fields: Record<string, string>
}

const collapse = (s: string): string => s.replace(/\s+/g, ' ').trim()

export function parseSpecTable(html: string): SpecTable {
  const fields: Record<string, string> = {}
  if (!html) return { fields }
  const $ = load(html)
  $('tr').each((_, tr) => {
    const cells = $(tr).find('td')
    if (cells.length < 2) return
    const label = collapse($(cells[0]).text())
    const value = collapse($(cells[1]).text())
    if (label && value) fields[label] = value
  })
  const brand = fields['Brands'] || fields['Brand']
  return brand ? { brand, fields } : { fields }
}
