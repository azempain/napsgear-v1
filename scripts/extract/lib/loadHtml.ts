// Thin wrapper around cheerio so every extractor reads HTML the same way.
// The pure form (loadHtml) keeps unit tests filesystem-free.

import { promises as fs } from 'node:fs'
import * as cheerio from 'cheerio'

export function loadHtml(html: string): cheerio.CheerioAPI {
  return cheerio.load(html)
}

export async function loadHtmlFromFile(filePath: string): Promise<cheerio.CheerioAPI> {
  const html = await fs.readFile(filePath, 'utf8')
  return loadHtml(html)
}
