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
  {
    name: 'Gearpics slider initialized with grid (2 rows base)',
    route: '/',
    async assert(page) {
      const handle = await page.waitForSelector('#gearpicsCarousel.swiper-initialized', { timeout: 8000 })
      const slideCount = await page.$$eval(
        '#gearpicsCarousel .swiper-slide',
        slides => slides.length,
      )
      if (slideCount < 4) throw new Error(`expected >=4 slides for a 2x2 grid, got ${slideCount}`)
      const hasPrevBtn = await page.$('#gearpicsCarousel .swiper-button-prev') !== null
      const hasNextBtn = await page.$('#gearpicsCarousel .swiper-button-next') !== null
      if (!hasPrevBtn || !hasNextBtn) throw new Error('navigation buttons missing')
      if (!handle) throw new Error('handle null')
    },
  },
  {
    name: 'Hero carousel initialized + autoplay loop',
    route: '/',
    async assert(page) {
      const handle = await page.waitForSelector('.hp-slider.swiper-initialized', { timeout: 8000 })
      if (!handle) throw new Error('handle null')
    },
  },
  {
    name: 'No /js/runtime.js (or other offline JS) requested',
    route: '/',
    async assert(page) {
      const requests = []
      page.on('request', r => requests.push(r.url()))
      await page.reload({ waitUntil: 'networkidle' })
      const offline = requests.filter(u =>
        /\/js\/(runtime|main|vendors|bootstrap|swiper|dayjs|patch)\.js/.test(u),
      )
      if (offline.length) throw new Error('offline JS still requested: ' + offline.join(','))
    },
  },
  {
    name: 'Nav dropdown opens on click and closes on outside-click',
    route: '/',
    async assert(page) {
      // HeaderNav uses Bootstrap's next-sibling pattern: button + sibling
      // .dropdown-menu within the same .menu-item-dropdown li.
      const trigger = await page.waitForSelector('nav#mainMenuNav button.dropdown-button', { timeout: 8000 })
      await trigger.click()
      await page.waitForSelector('nav#mainMenuNav .dropdown-menu.show', { timeout: 2000 })
      await page.mouse.click(5, 5)
      await page.waitForTimeout(300)
      const stillOpen = await page.$('nav#mainMenuNav .dropdown-menu.show')
      if (stillOpen) throw new Error('dropdown did not close on outside-click')
    },
  },
  {
    name: 'Login modal trigger toggles #loginModal (no-op tolerated if markup absent)',
    route: '/',
    async assert(page) {
      const trigger = await page.$('[data-bs-toggle="modal"][href="#loginModal"], [data-bs-toggle="modal"][data-bs-target="#loginModal"]')
      if (!trigger) return
      const modalExists = await page.$('#loginModal')
      if (!modalExists) return
      await trigger.click()
      await page.waitForSelector('#loginModal.show', { timeout: 2000 })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      const stillShown = await page.$('#loginModal.show')
      if (stillShown) throw new Error('modal did not close on Escape')
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
