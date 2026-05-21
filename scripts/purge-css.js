#!/usr/bin/env node
// Post-build PurgeCSS pass on public/css/main.css and public/css/vendors.css.
//
// Runs against the static export in ./out so PurgeCSS sees the actual HTML
// + JS that ships to browsers. Any selector that doesn't appear in either
// is dropped from the in-place out/css/*.css copies. The original files
// under public/css/ stay untouched so re-running `pnpm build` always
// regenerates a clean baseline.
//
// Run via:  pnpm purge-css   (typically as a postbuild step in CI)
//
// Anything JS toggles dynamically (.show, .fixed, .active, etc.) must be
// in the safelist below — PurgeCSS can't see runtime state changes.

const fs = require('node:fs')
const path = require('node:path')
const { PurgeCSS } = require('purgecss')

const OUT_DIR     = path.join(process.cwd(), 'out')
const TARGETS     = ['out/css/main.css', 'out/css/vendors.css']
const CONTENT     = [
  'out/**/*.html',
  'out/_next/static/chunks/**/*.js',
]

// State / interaction classes that NavInteractions.tsx, useStickyHeader.ts,
// CartView.tsx and friends toggle at runtime. PurgeCSS can't see these so
// they must be listed explicitly.
const SAFELIST = {
  standard: [
    'show', 'fade', 'in', 'open', 'collapsed', 'collapse', 'collapsing',
    'active', 'disabled', 'visible', 'hidden',
    'fixed', 'is-fixed', 'is-active', 'is-loaded', 'is-invalid',
    'has-sticky-header',
    'modal-open', 'modal-backdrop',
    'ngc-skeleton',
    'notification',
  ],
  greedy: [
    // Bootstrap-style state and modifier patterns; greedy matches anywhere
    /^show$/,
    /^fade$/,
    /-show$/, /-active$/, /-collapsed$/, /-open$/,
    // Swiper writes these onto carousel elements at runtime
    /^swiper-/,
    // We toggle .ngc-* classes via React state — keep them all
    /^ngc-/,
    // CSS animations referenced via animation-name
    /^nav/, /^slide/, /^fade/,
  ],
  // Keyframe names PurgeCSS would otherwise drop because they're only
  // referenced inside animation: ...
  keyframes: [/.*/],
  // Don't drop @font-face rules — fonts are picked up by url() lookups
  // we can't always trace.
  fontFace: true,
  variables: true,
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1)
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error(`× No build output at ${OUT_DIR}`)
    console.error('  Run \`pnpm build\` first.')
    process.exit(1)
  }

  const present = TARGETS.filter(t => fs.existsSync(t))
  if (present.length === 0) {
    console.error('× No target CSS files found under out/css/.')
    process.exit(1)
  }

  console.log(`Purging ${present.length} file(s):`)
  const before = present.map(t => ({ t, size: fs.statSync(t).size }))
  for (const b of before) {
    console.log(`  ${kb(b.size).padStart(7)}KB  ${b.t.replace(/\\/g, '/')}  (before)`)
  }

  const results = await new PurgeCSS().purge({
    content: CONTENT,
    css: present,
    safelist: SAFELIST,
    defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
  })

  let totalBefore = 0, totalAfter = 0
  for (const r of results) {
    if (!r.file) continue
    fs.writeFileSync(r.file, r.css)
    const after = fs.statSync(r.file).size
    const orig = before.find(b => b.t === r.file)?.size ?? after
    totalBefore += orig
    totalAfter  += after
    const pct = orig === 0 ? 0 : Math.round((1 - after / orig) * 100)
    console.log(`  ${kb(after).padStart(7)}KB  ${r.file.replace(/\\/g, '/')}  (after, ${pct}% smaller)`)
  }

  const totalPct = totalBefore === 0 ? 0 : Math.round((1 - totalAfter / totalBefore) * 100)
  console.log(`\n  total: ${kb(totalBefore)}KB → ${kb(totalAfter)}KB  (${totalPct}% smaller)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
