#!/usr/bin/env node
/**
 * One-time (and re-runnable) image optimization pass.
 *
 * For every .jpg/.jpeg/.png under public/images/ and public/img/:
 *   - if the source is wider than MAX_WIDTH_BY_DIR, resize down preserving
 *     aspect ratio, re-encode at quality 86 (raster) and overwrite the
 *     original (so JPGs stay JPGs, idempotent on a second run)
 *   - emit a .webp companion next to the original at quality 82, max width
 *     same as above; <picture> / <source> fallbacks pick the smaller one
 *
 * Re-running is safe: the .webp companion is overwritten in-place, and
 * the raster source is only re-encoded if its current pixel width exceeds
 * the per-directory cap.
 *
 * Run via:  pnpm exec tsx scripts/optimize-images.ts
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOTS = ['public/images', 'public/img'] as const
const RASTER_EXT = /\.(jpe?g|png)$/i

// Per-directory max width. Banners are hero-sized; everything else stays
// at 800px since that's plenty for cards / thumbnails on retina screens.
const MAX_WIDTH_BY_DIR: { match: RegExp; max: number }[] = [
  { match: /[\/\\]banners[\/\\]/i,    max: 1280 },
  { match: /[\/\\]vimeo[\/\\]/i,      max: 720  },
  { match: /./,                       max: 800  },
]
const WEBP_QUALITY  = 82
const JPEG_QUALITY  = 86
const PNG_COMPRESS  = 9

function maxWidthFor(p: string): number {
  for (const rule of MAX_WIDTH_BY_DIR) {
    if (rule.match.test(p)) return rule.max
  }
  return 800
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  let entries: import('node:fs').Dirent[] = []
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...await walk(full))
    } else if (e.isFile() && RASTER_EXT.test(e.name)) {
      out.push(full)
    }
  }
  return out
}

interface FileStats {
  before: number
  after: number
  webp: number
}

async function process(file: string): Promise<FileStats | null> {
  const beforeStat = await fs.stat(file)
  const maxW = maxWidthFor(file)

  // Read the source into memory ONCE (Windows / OneDrive can lock a file
  // between two sharp(file) opens; buffer-based reads avoid the reopen).
  const sourceBuf = await fs.readFile(file)
  const meta = await sharp(sourceBuf, { failOn: 'none' }).metadata()
  if (!meta.width || !meta.height) return null

  const shouldResize = meta.width > maxW
  const ext = path.extname(file).toLowerCase()

  if (shouldResize) {
    const pipeline = sharp(sourceBuf, { failOn: 'none' }).resize({
      width: maxW,
      withoutEnlargement: true,
    })
    const outBuf = ext === '.png'
      ? await pipeline.png({ compressionLevel: PNG_COMPRESS }).toBuffer()
      : await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer()
    await fs.writeFile(file, outBuf)
  }

  const afterStat = await fs.stat(file)

  // WebP companion (always re-emitted so re-runs converge on the latest
  // quality settings). Source is the in-memory buffer so we never hit the
  // double-open issue.
  const webpPath = file.replace(RASTER_EXT, '.webp')
  const webpBuf = await sharp(shouldResize ? sourceBuf : sourceBuf, { failOn: 'none' })
    .resize({ width: maxW, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
  await fs.writeFile(webpPath, webpBuf)
  const webpStat = await fs.stat(webpPath)

  return {
    before: beforeStat.size,
    after: afterStat.size,
    webp: webpStat.size,
  }
}

function pct(a: number, b: number): string {
  if (a === 0) return '—'
  return `${Math.round((1 - b / a) * 100)}%`
}

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

async function main() {
  const files: string[] = []
  for (const root of ROOTS) files.push(...await walk(root))

  console.log(`Optimizing ${files.length} raster image${files.length === 1 ? '' : 's'}…\n`)

  let totalBefore = 0, totalAfter = 0, totalWebp = 0, ok = 0, fail = 0
  for (const f of files) {
    try {
      const s = await process(f)
      if (!s) { fail++; continue }
      totalBefore += s.before
      totalAfter  += s.after
      totalWebp   += s.webp
      ok++
      const rel = f.replace(/\\/g, '/').replace(/^public\//, '')
      console.log(`  ${rel}`)
      console.log(`    src ${human(s.before)} → ${human(s.after)} (${pct(s.before, s.after)})    webp ${human(s.webp)} (${pct(s.before, s.webp)})`)
    } catch (e) {
      fail++
      console.log(`  ✗ ${f}: ${(e as Error).message}`)
    }
  }

  console.log('')
  console.log(`Done: ${ok} optimized, ${fail} failed`)
  console.log(`  total raster: ${human(totalBefore)} → ${human(totalAfter)}  (${pct(totalBefore, totalAfter)} smaller)`)
  console.log(`  total webp:   ${human(totalWebp)}                  (${pct(totalBefore, totalWebp)} vs original)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
