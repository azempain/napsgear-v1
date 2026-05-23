import { describe, it, expect } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { loadHtmlFromFile, loadHtml } from './loadHtml'

describe('loadHtml', () => {
  it('parses a raw HTML string into a queryable cheerio doc', () => {
    const $ = loadHtml('<html><body><h1 class="t">Hello</h1></body></html>')
    expect($('h1.t').text()).toBe('Hello')
  })

  it('loadHtmlFromFile reads a file from disk', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'loadhtml-'))
    const file = path.join(dir, 'sample.html')
    await fs.writeFile(file, '<html><body><p>x</p></body></html>', 'utf8')
    const $ = await loadHtmlFromFile(file)
    expect($('p').text()).toBe('x')
  })
})
