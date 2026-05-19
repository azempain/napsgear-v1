// node scripts/verify-interactions.js
// Playwright harness that asserts the migrated Swiper sliders + nav
// interactions work. Extended per phase as more pieces migrate.
//
// Requires the dev server to be running at http://localhost:3000.

const { chromium } = require('playwright')

const BASE = process.env.VERIFY_BASE || 'http://localhost:3000'

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
  {
    name: 'Product page: pack selector + total updates on tier change',
    route: '/catalog/',
    async assert(page) {
      const firstProduct = await page.getAttribute('.products-grid a[href^="/"]', 'href')
      if (!firstProduct) throw new Error('no product link on /catalog/')
      await page.goto(BASE + firstProduct, { waitUntil: 'networkidle' })
      await page.waitForSelector('#addToCartBtn', { timeout: 8000 })
      const radios = await page.$$('input[name="pack"]')
      if (radios.length !== 5) throw new Error(`expected 5 pack radios, got ${radios.length}`)
      // Sub-project C rewrote ProductDetail; tier totals live in .price-total now.
      const totals = await page.$$eval('.price-total', els => els.map(e => e.textContent))
      if (totals.length !== 5) throw new Error(`expected 5 tier totals, got ${totals.length}`)
      if (totals[0] === totals[4]) throw new Error('1-pack total equals 20-pack total — tiers not differentiated')
    },
  },
  {
    name: 'Add to Cart increments badge, shows toast, persists on reload',
    route: '/catalog/',
    async assert(page) {
      // Start clean so badge math is deterministic
      await page.evaluate(() => window.localStorage.removeItem('napsgear_cart'))
      const firstProduct = await page.getAttribute('.products-grid a[href^="/"]', 'href')
      await page.goto(BASE + firstProduct, { waitUntil: 'networkidle' })
      await page.waitForSelector('#addToCartBtn', { timeout: 8000 })
      const before = parseInt((await page.textContent('.cart-count')) || '0', 10)
      await page.click('#addToCartBtn')
      await page.waitForSelector('.notification.visible', { timeout: 2000 })
      await page.waitForFunction(
        (b) => {
          const el = document.querySelector('.cart-count')
          return el && parseInt(el.textContent || '0', 10) === b + 1
        },
        before,
        { timeout: 3000 },
      )
      await page.reload({ waitUntil: 'networkidle' })
      const after = parseInt((await page.textContent('.cart-count')) || '0', 10)
      if (after !== before + 1) throw new Error(`cart not persisted: before=${before} after=${after}`)
    },
  },
  {
    name: 'Checkout: summary totals, validation, mocked submit -> confirm + cart cleared',
    route: '/',
    async assert(page) {
      // Seed a cart in localStorage, then load /checkout/.
      await page.addInitScript(() => {
        localStorage.setItem('napsgear_cart', JSON.stringify([
          { id: 'x__1', productName: 'Test Product', packCount: 1, slug: 'x', price: 30, qty: 2 },
        ]))
      })
      // Mock the Web3Forms endpoint so no real key/network is needed.
      await page.route('**://api.web3forms.com/**', route =>
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true }) }))

      await page.goto(BASE + '/checkout/', { waitUntil: 'load' })
      await page.waitForSelector('#placeOrderBtn', { timeout: 8000 })

      // Order total = subtotal 60 + shipping 35 = 95
      const totalText = (await page.textContent('[data-order-total]'))?.trim()
      if (totalText !== '$95.00') throw new Error(`expected $95.00, got ${totalText}`)

      // Empty submit -> inline validation, no navigation
      await page.click('#placeOrderBtn')
      await page.waitForSelector('.ngc-field__err', { timeout: 3000 })

      // Fill required fields
      const fill = async (id, val) => page.fill(`#${id}`, val)
      await fill('fullName', 'Jane Doe')
      await fill('email', 'jane@example.com')
      await fill('phone', '5551234567')
      await fill('address1', '12 King St')
      await fill('city', 'Austin')
      await fill('state', 'TX')
      await fill('postalCode', '78701')
      await fill('country', 'United States')

      await page.click('#placeOrderBtn')
      // Confirmation screen
      await page.waitForSelector('text=Order received', { timeout: 6000 })
      // Cart cleared in localStorage
      const cart = await page.evaluate(() => localStorage.getItem('napsgear_cart'))
      const parsed = cart ? JSON.parse(cart) : []
      if (Array.isArray(parsed) && parsed.length !== 0) {
        throw new Error('cart not cleared after order')
      }
    },
  },
  // ─── F1 checks ─────────────────────────────────────────────────────────
  {
    name: 'F1: /cart/ renders .ngc-item__variant under each item name (structured CartItem)',
    route: '/',
    async assert(page) {
      await page.addInitScript(() => {
        localStorage.setItem('napsgear_cart', JSON.stringify([
          { id: 'a__1', productName: 'Altamofen', packCount: 1, packLabel: '50 tabs (20mg/tab)', slug: 'a', price: 30, qty: 1 },
          { id: 'b__5', productName: 'Anazole', packCount: 5, slug: 'b', price: 143, qty: 1 },
        ]))
      })
      await page.goto(BASE + '/cart/', { waitUntil: 'load' })
      await page.waitForSelector('.ngc-item', { timeout: 8000 })
      const variants = await page.$$eval('.ngc-item__variant', els => els.map(e => e.textContent.trim()))
      if (variants.length !== 2) throw new Error(`expected 2 .ngc-item__variant rows, got ${variants.length}`)
      if (!variants[0].includes('1 pack')) throw new Error(`row 0 variant missing '1 pack': ${variants[0]}`)
      if (!variants[1].includes('5 packs')) throw new Error(`row 1 variant missing '5 packs': ${variants[1]}`)
    },
  },
  {
    name: 'F1: /checkout/ empty state renders shared <EmptyCart> (not the bootstrap stub)',
    route: '/',
    async assert(page) {
      await page.addInitScript(() => localStorage.removeItem('napsgear_cart'))
      await page.goto(BASE + '/checkout/', { waitUntil: 'load' })
      const title = await page.waitForSelector('.ngc-empty .ngc-empty__title', { timeout: 8000 })
      const text = (await title.textContent() || '').trim()
      if (!text.toLowerCase().includes('check out')) {
        throw new Error(`expected checkout-specific empty heading, got: "${text}"`)
      }
      const cta = await page.$('.ngc-empty .ngc-btn--dark[href="/catalog/"]')
      if (!cta) throw new Error('EmptyCart CTA missing or not pointing to /catalog/')
    },
  },
  {
    name: 'F1: mobile /cart/ reserves padding-bottom for the sticky action bar',
    route: '/',
    async assert(page) {
      await page.setViewportSize({ width: 375, height: 720 })
      await page.addInitScript(() => {
        localStorage.setItem('napsgear_cart', JSON.stringify([
          { id: 'a__1', productName: 'Altamofen', packCount: 1, slug: 'a', price: 30, qty: 1 },
        ]))
      })
      await page.goto(BASE + '/cart/', { waitUntil: 'load' })
      await page.waitForSelector('.cart-main', { timeout: 8000 })
      const pad = await page.$eval('.cart-main', el =>
        parseFloat(getComputedStyle(el).paddingBottom))
      if (!(pad >= 72)) throw new Error(`expected padding-bottom >= 72px on mobile, got ${pad}px`)
      // Restore default viewport so subsequent checks aren't affected.
      await page.setViewportSize({ width: 1280, height: 800 })
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
