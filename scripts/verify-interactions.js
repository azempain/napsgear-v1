// node scripts/verify-interactions.js
// Playwright harness that asserts the migrated Swiper sliders + nav
// interactions work. Extended per phase as more pieces migrate.
//
// Requires the dev server to be running at http://localhost:3000.

const { chromium } = require('playwright')

const BASE = 'http://localhost:3000'

const CHECKS = [
  // populated per phase — see plan tasks
]

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const failures = []

  for (const check of CHECKS) {
    try {
      await page.goto(BASE + check.route, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(1500)
      await check.assert(page)
      console.log(`  ✓ ${check.name}`)
    } catch (e) {
      console.log(`  ✗ ${check.name}: ${e.message}`)
      failures.push(check.name)
    }
  }

  await browser.close()

  if (failures.length) {
    console.log(`\n❌ FAIL — ${failures.length}/${CHECKS.length}`)
    process.exit(1)
  }
  console.log(`\n✅ PASS — ${CHECKS.length}/${CHECKS.length}`)
})().catch(e => { console.error('harness error:', e.message); process.exit(2) })
