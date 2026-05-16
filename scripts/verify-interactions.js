// node scripts/verify-interactions.js
// Playwright harness that asserts the migrated Swiper sliders + nav
// interactions work. Extended per phase as more pieces migrate.
//
// Requires the dev server to be running at http://localhost:3000.

const { chromium } = require('playwright')

const BASE = 'http://localhost:3000'

const CHECKS = [
  {
    name: 'AMA slider initialized + at least 5 slides',
    route: '/',
    async assert(page) {
      const handle = await page.waitForSelector('#amaCarousel.swiper-initialized', { timeout: 8000 })
      const slideCount = await page.$$eval(
        '#amaCarousel .swiper-slide',
        slides => slides.length,
      )
      if (slideCount < 5) throw new Error(`expected >=5 slides, got ${slideCount}`)
      if (!handle) throw new Error('handle null')
    },
  },
  {
    name: 'QA slider initialized + at least 4 slides',
    route: '/',
    async assert(page) {
      const handle = await page.waitForSelector('#qaCarousel.swiper-initialized', { timeout: 8000 })
      const slideCount = await page.$$eval(
        '#qaCarousel .swiper-slide',
        slides => slides.length,
      )
      if (slideCount < 4) throw new Error(`expected >=4 slides, got ${slideCount}`)
      if (!handle) throw new Error('handle null')
    },
  },
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
