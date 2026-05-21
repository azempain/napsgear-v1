#!/usr/bin/env node
// Asserts the static-export JS bundle stays within budget.
//
// Walks out/_next/static/chunks/, gzips each .js file in-memory, and
// compares against per-chunk and total caps. Run after `pnpm build`;
// CI does both in sequence so a regression that ships an extra MB
// fails the merge gate.
//
// Numbers are gzipped sizes (the byte count actually shipped to the
// browser over HTTPS). Brotli would be ~15% smaller again but every
// CDN/server we'd realistically deploy to negotiates gzip too, so
// gzip is the conservative apples-to-apples budget.

const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

// Budgets are intentionally generous over today's measured size so a
// small refactor doesn't break the build, but tight enough to catch a
// rogue dependency that doubles the bundle.
const BUDGETS = {
  individualMaxKB: 300, // any single chunk
  totalMaxKB:      650, // sum of every chunk under out/_next/static/chunks
}

const CHUNK_DIR = path.join(process.cwd(), 'out', '_next', 'static', 'chunks')

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (e.isFile() && full.endsWith('.js')) out.push(full)
  }
  return out
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1)
}

function main() {
  if (!fs.existsSync(CHUNK_DIR)) {
    console.error(`× No build output at ${CHUNK_DIR}`)
    console.error('  Run \`pnpm build\` first.')
    process.exit(1)
  }

  const files = walk(CHUNK_DIR)
  if (files.length === 0) {
    console.error('× No JS chunks found — did the build complete?')
    process.exit(1)
  }

  files.sort()
  let total = 0
  const overLimit = []
  const heavy = []

  for (const f of files) {
    const raw = fs.readFileSync(f)
    const gz = zlib.gzipSync(raw, { level: 9 })
    total += gz.length
    const rel = path.relative(CHUNK_DIR, f).replace(/\\/g, '/')
    if (gz.length > BUDGETS.individualMaxKB * 1024) {
      overLimit.push({ rel, gz: gz.length })
    }
    if (gz.length > 50 * 1024) {
      heavy.push({ rel, gz: gz.length })
    }
  }

  // Show the heavy hitters so a regression's root cause is visible.
  heavy.sort((a, b) => b.gz - a.gz)
  if (heavy.length) {
    console.log('Heaviest chunks (>50KB gzipped):')
    for (const h of heavy.slice(0, 8)) {
      console.log(`  ${kb(h.gz).padStart(7)}KB  ${h.rel}`)
    }
    console.log('')
  }

  console.log(`${files.length} chunk${files.length === 1 ? '' : 's'}`)
  console.log(`  total:      ${kb(total)}KB gzipped     (budget ${BUDGETS.totalMaxKB}KB)`)
  if (heavy[0]) {
    console.log(`  heaviest:   ${kb(heavy[0].gz)}KB              (budget ${BUDGETS.individualMaxKB}KB per chunk)`)
  }

  const failures = []
  if (overLimit.length) {
    failures.push(
      `${overLimit.length} chunk(s) exceed ${BUDGETS.individualMaxKB}KB:\n` +
      overLimit.map(o => `      ${kb(o.gz)}KB  ${o.rel}`).join('\n'),
    )
  }
  if (total > BUDGETS.totalMaxKB * 1024) {
    failures.push(
      `Total ${kb(total)}KB exceeds ${BUDGETS.totalMaxKB}KB budget`,
    )
  }

  if (failures.length) {
    console.error('\n× Bundle budget exceeded:')
    for (const f of failures) console.error('  - ' + f)
    console.error('\nIf the regression is justified, bump BUDGETS in scripts/check-bundle-size.js')
    console.error('and explain in the commit message.')
    process.exit(1)
  }

  console.log('\n✓ Within budget')
}

main()
