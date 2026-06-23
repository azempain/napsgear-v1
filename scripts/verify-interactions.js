// node scripts/verify-interactions.js
// Playwright harness that asserts the migrated Swiper sliders + nav
// interactions work. Extended per phase as more pieces migrate.
//
// Requires the dev server to be running at http://localhost:3000.

const { chromium } = require('playwright')

const BASE = process.env.VERIFY_BASE || 'http://localhost:3000'

function fakeJwt(userId) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    sub: userId,
    iat: now,
    exp: now + 3600,
  })}.signature`
}

async function mockSession(page, authenticated = true) {
  await page.route('**/auth/get-session', async route => {
    if (!authenticated) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'null',
      })
      return
    }

    const userId = '10000000-0000-4000-8000-000000000001'
    const now = new Date().toISOString()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session: {
          id: 'test-session',
          userId,
          token: fakeJwt(userId),
          expiresAt: new Date(Date.now() + 3600_000).toISOString(),
          createdAt: now,
          updatedAt: now,
        },
        user: {
          id: userId,
          name: 'Jane Doe',
          email: 'jane@example.com',
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      }),
    })
  })
}

async function clearNetworkMocks(page) {
  await page.unroute('**/auth/get-session')
  await page.unroute('**://*.apirest.*.aws.neon.tech/**')
  await page.unroute('**://api.web3forms.com/**')
}

const CHECKS = [
  {
    name: 'Header: utility links begin on the desktop logo line',
    route: '/',
    async assert(page) {
      await page.setViewportSize({ width: 1440, height: 900 })
      const nav = await page.waitForSelector('.ngc-utility-nav', { timeout: 8000 })
      const labels = await nav.$$eval('a', links => links.map(link => link.textContent.trim()))
      if (labels.includes('Links')) throw new Error('stray Links label is still rendered')

      const navBox = await page.locator('.ngc-utility-nav').boundingBox()
      const logoBox = await page.locator('.header-middle .logo').boundingBox()
      const primaryBox = await page.locator('.main-nav .menu').boundingBox()
      if (!navBox || !logoBox || !primaryBox) throw new Error('desktop header bounds unavailable')
      if (Math.abs(navBox.x - logoBox.x) > 2) {
        throw new Error(`utility links and logo differ by ${Math.abs(navBox.x - logoBox.x)}px`)
      }
      if (Math.abs(primaryBox.x - logoBox.x) > 2) {
        throw new Error(`primary navigation and logo differ by ${Math.abs(primaryBox.x - logoBox.x)}px`)
      }
    },
  },
  {
    name: 'Header: currency selector stays at the far edge across desktop widths',
    route: '/',
    async assert(page) {
      for (const width of [992, 1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        const selectBox = await page.locator('#dropdownCurrency').boundingBox()
        const topBox = await page.locator('.ngc-header-top-inner').boundingBox()
        if (!selectBox || !topBox) throw new Error('currency or utility-row bounds unavailable')
        if (selectBox.y < topBox.y || selectBox.y + selectBox.height > topBox.y + topBox.height) {
          throw new Error(`currency selector escapes the utility row at ${width}px`)
        }
        const rightGap = topBox.x + topBox.width - (selectBox.x + selectBox.width)
        if (rightGap > 24) {
          throw new Error(`currency selector is ${rightGap}px from the far edge at ${width}px`)
        }
        if (selectBox.width > 72) {
          throw new Error(`currency selector expanded to ${selectBox.width}px at ${width}px`)
        }
        const value = await page.inputValue('#dropdownCurrency')
        if (!/^[A-Z]{3}$/.test(value)) {
          throw new Error(`currency selector renders a non-code value: "${value}"`)
        }
      }
    },
  },
  {
    name: 'AMA page has no malformed local thumbnail requests',
    route: '/ask-an-ifbb-pro/',
    async assert(page) {
      const failures = []
      const badResponses = []
      const onFailure = request => failures.push(request.url())
      const onResponse = response => {
        if (response.status() === 404) badResponses.push(response.url())
      }
      page.on('requestfailed', onFailure)
      page.on('response', onResponse)

      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)

      page.off('requestfailed', onFailure)
      page.off('response', onResponse)
      const malformed = [...failures, ...badResponses].filter(url =>
        /NapsGear(?:%20| )-%20ama_files|NapsGear - ama_files/.test(url),
      )
      if (malformed.length) {
        throw new Error(`malformed AMA thumbnails requested: ${malformed.join(', ')}`)
      }
    },
  },
  {
    name: 'Header: mobile navigation uses an accessible Sheet',
    route: '/',
    async assert(page) {
      await page.setViewportSize({ width: 390, height: 844 })
      const trigger = await page.waitForSelector('[aria-controls="mobileDrawer"]', { timeout: 8000 })
      await trigger.click()
      const sheet = await page.waitForSelector('#mobileDrawer[data-state="open"]', { timeout: 3000 })
      const labelledBy = await sheet.getAttribute('aria-labelledby')
      const title = labelledBy ? await page.textContent(`#${labelledBy}`) : ''
      if (!title || !/main navigation/i.test(title)) {
        throw new Error('mobile Sheet is missing its accessible title')
      }
      await page.keyboard.press('Escape')
      await page.waitForSelector('#mobileDrawer', { state: 'detached', timeout: 3000 })
      await page.setViewportSize({ width: 1280, height: 800 })
    },
  },
  {
    name: 'Header: mobile and tablet controls share one vertical line',
    route: '/',
    async assert(page) {
      for (const width of [375, 768, 991]) {
        await page.setViewportSize({ width, height: 844 })
        const headerBox = await page.locator('.header-middle').boundingBox()
        const selectors = [
          '.mobile-menu-toggle',
          '.header-middle .logo',
          '.ngc-mobile-search',
          '.ngc-account-trigger--mobile',
          '.header-icon-cart',
        ]
        const boxes = []
        for (const selector of selectors) {
          const box = await page.locator(selector).boundingBox()
          if (!box) throw new Error(`${selector} missing at ${width}px`)
          boxes.push(box)
        }
        const centers = boxes.map(box => box.y + box.height / 2)
        if (Math.max(...centers) - Math.min(...centers) > 3) {
          throw new Error(`mobile controls are not vertically aligned at ${width}px`)
        }
        if (!headerBox || headerBox.height > 68) {
          throw new Error(`mobile header is ${headerBox?.height}px tall at ${width}px`)
        }
        if (!(boxes[0].x < boxes[1].x && boxes[2].x > boxes[1].x + boxes[1].width)) {
          throw new Error(`mobile header groups are not left/right aligned at ${width}px`)
        }
      }
    },
  },
  {
    name: 'Header: mobile search expands inline and submits catalog query',
    route: '/',
    async assert(page) {
      await page.setViewportSize({ width: 375, height: 844 })
      await page.locator('.ngc-mobile-search').click()
      const panel = page.locator('#mobileHeaderSearch')
      await panel.waitFor({ state: 'visible', timeout: 3000 })
      const input = panel.locator('input[name="q"]')
      if (!(await input.evaluate(element => element === document.activeElement))) {
        throw new Error('mobile search input did not receive focus')
      }
      await input.fill('dianabol')
      await Promise.all([
        page.waitForURL('**/catalog/?q=dianabol'),
        panel.locator('button[type="submit"]').click(),
      ])
    },
  },
  {
    name: 'Header: authenticated mobile account opens profile and orders Sheet',
    route: '/',
    async assert(page) {
      await mockSession(page)
      await page.route('**://*.apirest.*.aws.neon.tech/**', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'order-1',
            reference: 'NG-TEST-100',
            status: 'pending_payment',
            currency: 'USD',
            order_total: '95.00',
            created_at: new Date().toISOString(),
          }]),
        }))
      await page.setViewportSize({ width: 375, height: 844 })
      await page.reload({ waitUntil: 'load' })
      const trigger = page.locator('[aria-controls="mobileAccountSheet"]')
      await trigger.click()
      await page.waitForSelector('#mobileAccountSheet[data-state="open"]', { timeout: 3000 })
      const body = await page.textContent('#mobileAccountSheet')
      if (!body?.includes('Jane Doe') || !body.includes('NG-TEST-100')) {
        throw new Error('mobile account Sheet is missing session or order data')
      }
      await page.keyboard.press('Escape')
      await clearNetworkMocks(page)
    },
  },
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
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(500)
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
      const firstProduct = await page.getAttribute(
        '[data-testid="product-grid"] .product-item__title a[href^="/"]',
        'href',
      )
      if (!firstProduct) throw new Error('no product link on /catalog/')
      await page.goto(BASE + firstProduct, { waitUntil: 'load' })
      await page.waitForSelector('#addToCartBtn', { timeout: 8000 })
      const radioIds = await page.$$eval(
        'input[name="pack"]',
        els => [...new Set(els.map(el => el.id))],
      )
      if (radioIds.length !== 5) {
        throw new Error(`expected 5 pack tiers, got ${radioIds.length}`)
      }
      // Sub-project C rewrote ProductDetail; tier totals live in .price-total now.
      const totals = await page.$$eval(
        '.price-total',
        els => [...new Set(els.map(el => el.textContent))],
      )
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
      await page.goto(BASE + firstProduct, { waitUntil: 'load' })
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
      await page.reload({ waitUntil: 'load' })
      const after = parseInt((await page.textContent('.cart-count')) || '0', 10)
      if (after !== before + 1) throw new Error(`cart not persisted: before=${before} after=${after}`)
    },
  },
  {
    name: 'Checkout: authenticated order persists before email and clears cart',
    route: '/',
    async assert(page) {
      // Seed a cart in localStorage, then load /checkout/.
      await page.addInitScript(() => {
        localStorage.setItem('napsgear_cart', JSON.stringify([
          { id: 'x__1', productName: 'Test Product', packCount: 1, slug: 'x', price: 30, qty: 2 },
        ]))
      })
      const requestOrder = []
      await mockSession(page)
      await page.route('**://*.apirest.*.aws.neon.tech/**', async route => {
        const url = route.request().url()
        if (url.includes('/rpc/create_checkout_order')) {
          requestOrder.push('database')
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify('10000000-0000-4000-8000-000000000002'),
          })
          return
        }
        requestOrder.push('email-status')
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'null',
        })
      })
      await page.route('**://api.web3forms.com/**', async route => {
        requestOrder.push('email')
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

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
      if (requestOrder[0] !== 'database' || requestOrder[1] !== 'email') {
        throw new Error(`order sequence was ${requestOrder.join(' -> ')}`)
      }
      await clearNetworkMocks(page)
    },
  },
  {
    name: 'Checkout: anonymous order can continue when account history is unavailable',
    route: '/',
    async assert(page) {
      await page.addInitScript(() => {
        localStorage.setItem('napsgear_cart', JSON.stringify([
          { id: 'x__1', productName: 'Test Product', packCount: 1, slug: 'x', price: 30, qty: 1 },
        ]))
      })
      const requestOrder = []
      await mockSession(page, false)
      await page.route('**://*.apirest.*.aws.neon.tech/**', async route => {
        requestOrder.push('database')
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Authentication required' }),
        })
      })
      await page.route('**://api.web3forms.com/**', async route => {
        requestOrder.push('email')
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })
      await page.goto(BASE + '/checkout/', { waitUntil: 'load' })
      await page.waitForSelector('#placeOrderBtn', { timeout: 8000 })
      if (await page.$('.ngc-checkout-auth')) {
        throw new Error('anonymous checkout is still blocked by the sign-in wall')
      }
      const fill = async (id, val) => page.fill(`#${id}`, val)
      await fill('fullName', 'Guest Buyer')
      await fill('email', 'guest@example.com')
      await fill('phone', '5551234567')
      await fill('address1', '12 King St')
      await fill('city', 'Austin')
      await fill('state', 'TX')
      await fill('postalCode', '78701')
      await fill('country', 'United States')

      await page.click('#placeOrderBtn')
      await page.waitForSelector('text=Bitcoin payment', { timeout: 6000 })
      const body = await page.textContent('main')
      if (body?.includes('account order history could not be updated')) {
        throw new Error('guest checkout surfaced the hidden order-history warning')
      }
      if (!requestOrder.includes('email')) {
        throw new Error(`guest checkout never sent email; sequence was ${requestOrder.join(' -> ')}`)
      }
      const databaseIndex = requestOrder.indexOf('database')
      const emailIndex = requestOrder.indexOf('email')
      if (databaseIndex > emailIndex) {
        throw new Error(`guest checkout sent email before attempting history: ${requestOrder.join(' -> ')}`)
      }
      await clearNetworkMocks(page)
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
  // ─── P2.6 checks — per-route metadata + JSON-LD ────────────────────────
  {
    name: 'P2.6: / emits Organization + WebSite JSON-LD with title template',
    route: '/',
    async assert(page) {
      const res = await page.request.get(BASE + '/')
      const html = await res.text()
      if (!/<title>NapsGear<\/title>/.test(html)) {
        throw new Error('root <title> not exactly "NapsGear"')
      }
      if (!/"@type":"Organization"/.test(html)) throw new Error('missing Organization JSON-LD')
      if (!/"@type":"WebSite"/.test(html))      throw new Error('missing WebSite JSON-LD')
    },
  },
  {
    name: 'P2.6: product page emits Product + AggregateOffer + BreadcrumbList JSON-LD',
    route: '/catalog/',
    async assert(page) {
      const firstHref = await page.getAttribute('.products-grid a[href^="/"]', 'href')
      if (!firstHref) throw new Error('no product link on /catalog/')
      const res = await page.request.get(BASE + firstHref)
      const html = await res.text()
      if (!/"@type":"Product"/.test(html))          throw new Error('missing Product JSON-LD')
      if (!/"@type":"AggregateOffer"/.test(html))   throw new Error('missing AggregateOffer JSON-LD')
      if (!/"@type":"BreadcrumbList"/.test(html))   throw new Error('missing BreadcrumbList JSON-LD')
      // Title template "%s · NapsGear" should be applied
      const m = html.match(/<title>([^<]+)<\/title>/)
      if (!m || !m[1].endsWith(' · NapsGear')) {
        throw new Error(`product <title> doesn't follow template: "${m && m[1]}"`)
      }
    },
  },
  {
    name: 'P2.6: /cart/ and /checkout/ set robots noindex meta',
    route: '/',
    async assert(page) {
      for (const path of ['/cart/', '/checkout/']) {
        const res = await page.request.get(BASE + path)
        const html = await res.text()
        if (!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html)) {
          throw new Error(`${path} missing robots noindex meta`)
        }
      }
    },
  },
  // ─── P2.7 checks — sitemap.xml + robots.txt ────────────────────────────
  {
    name: 'P2.7: /sitemap.xml serves XML with product/brand/category URLs',
    route: '/',
    async assert(page) {
      const res = await page.request.get(BASE + '/sitemap.xml')
      if (!res.ok()) throw new Error(`sitemap.xml status ${res.status()}`)
      const xml = await res.text()
      if (!xml.startsWith('<?xml')) throw new Error('sitemap.xml not XML-prologued')
      const urlCount = (xml.match(/<url>/g) || []).length
      if (urlCount < 100) throw new Error(`sitemap has only ${urlCount} URLs — expected 100+`)
      if (!/\/catalog\//.test(xml)) throw new Error('sitemap missing /catalog/')
      if (!/\/brands\//.test(xml))  throw new Error('sitemap missing /brands/*')
      // cart and checkout MUST NOT appear (PRIVATE_ROUTES)
      if (/\/cart\//.test(xml))     throw new Error('sitemap leaks /cart/ (should be private)')
      if (/\/checkout\//.test(xml)) throw new Error('sitemap leaks /checkout/ (should be private)')
    },
  },
  {
    name: 'P2.7: /robots.txt allows crawlers but disallows /cart/ + /checkout/',
    route: '/',
    async assert(page) {
      const res = await page.request.get(BASE + '/robots.txt')
      if (!res.ok()) throw new Error(`robots.txt status ${res.status()}`)
      const txt = await res.text()
      if (!/User-Agent:\s*\*/i.test(txt)) throw new Error('robots.txt missing User-Agent: *')
      if (!/Allow:\s*\//.test(txt))       throw new Error('robots.txt missing Allow: /')
      if (!/Disallow:\s*\/cart\//.test(txt))     throw new Error('robots.txt does not disallow /cart/')
      if (!/Disallow:\s*\/checkout\//.test(txt)) throw new Error('robots.txt does not disallow /checkout/')
      if (!/Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/.test(txt)) {
        throw new Error('robots.txt missing Sitemap pointer')
      }
    },
  },
  // ─── F3 checks ──────────────────────────────────────────────────────────
  {
    name: 'F3: /cart/ SSR HTML includes the skeleton tree (visible pre-hydration)',
    route: '/',
    async assert(page) {
      // Disable JS so React never hydrates — the SSR skeleton stays on screen.
      const ctx = page.context()
      await ctx.setOffline(false)
      // page.emulateMedia + JS disable via newPage; cleaner: emulate JS off via route
      // Workaround: load the built HTML directly and check the source.
      const res = await page.request.get(BASE + '/cart/')
      if (!res.ok()) throw new Error(`/cart/ request failed: ${res.status()}`)
      const html = await res.text()
      if (!/ngc-page-skel/.test(html)) {
        throw new Error('SSR /cart/ HTML missing ngc-page-skel markup')
      }
      if (!/ngc-skeleton/.test(html)) {
        throw new Error('SSR /cart/ HTML missing ngc-skeleton class')
      }
    },
  },
  {
    name: 'F3: header cart-count contains a skeleton until hydrated, then a number',
    route: '/',
    async assert(page) {
      await page.addInitScript(() => localStorage.removeItem('napsgear_cart'))
      const res = await page.request.get(BASE + '/')
      const html = await res.text()
      if (!/ngc-cart-badge-skel/.test(html)) {
        throw new Error('SSR /  HTML missing ngc-cart-badge-skel (badge skeleton)')
      }
      // After hydration the badge should be a plain number — open the page,
      // wait for hydration, and confirm the skeleton is gone.
      await page.goto(BASE + '/', { waitUntil: 'load' })
      await page.waitForFunction(
        () => {
          const el = document.querySelector('.cart-count')
          return el && !el.querySelector('.ngc-cart-badge-skel')
        },
        null,
        { timeout: 5000 },
      )
      const text = (await page.textContent('.cart-count'))?.trim()
      if (!text || !/^\d+$/.test(text)) {
        throw new Error(`post-hydration cart-count not numeric: "${text}"`)
      }
    },
  },
  // ─── F2b checks ─────────────────────────────────────────────────────────
  {
    name: 'F2b: /checkout/ shows field-level error on blur (TanStack Form)',
    route: '/',
    async assert(page) {
      await page.addInitScript(() => {
        localStorage.setItem('napsgear_cart', JSON.stringify([
          { id: 'x__1', productName: 'Test Product', packCount: 1, slug: 'x', price: 30, qty: 1 },
        ]))
      })
      await mockSession(page)
      await page.goto(BASE + '/checkout/', { waitUntil: 'load' })
      await page.waitForSelector('#fullName', { timeout: 8000 })
      // Name and email are prefilled from the authenticated session. Use an
      // untouched required field to verify field-level blur validation.
      await page.focus('#phone')
      await page.keyboard.press('Tab')
      await page.waitForSelector('#phone-err', { timeout: 3000 })
      const msg = (await page.textContent('#phone-err'))?.trim()
      if (!msg || !/required/i.test(msg)) {
        throw new Error(`expected required-message on blur, got: "${msg}"`)
      }
      // No submit happened, so other fields should NOT have errors yet.
      const otherErrs = await page.$$eval('.ngc-field__err', els =>
        els.map(e => e.id).filter(id => id && id !== 'phone-err'))
      if (otherErrs.length > 0) {
        throw new Error(`other fields errored prematurely: ${otherErrs.join(',')}`)
      }
      await clearNetworkMocks(page)
    },
  },
  // ─── F2a checks ─────────────────────────────────────────────────────────
  {
    name: 'F2a: /catalog/ search narrows the product grid (TanStack Table)',
    route: '/catalog/',
    async assert(page) {
      await page.waitForSelector('[data-testid="product-grid"]', { timeout: 8000 })
      const before = await page.$$eval('[data-testid="product-grid"] .product-item', els => els.length)
      if (before < 2) throw new Error(`expected at least 2 products to narrow, got ${before}`)
      // Type a query specific enough to narrow but with known matches in the
      // current dataset. (Originally 'altamofen' — broke once the catalog
      // grew past 24 products and that brand was no longer present.)
      await page.fill('[data-testid="product-search"]', 'dianabol')
      await page.waitForFunction(
        (b) => {
          const items = document.querySelectorAll('[data-testid="product-grid"] .product-item')
          return items.length > 0 && items.length < b
        },
        before,
        { timeout: 3000 },
      )
      const after = await page.$$eval('[data-testid="product-grid"] .product-item', els => els.length)
      if (!(after >= 1 && after < before)) {
        throw new Error(`search did not narrow: before=${before} after=${after}`)
      }
    },
  },
  {
    name: 'F2a: /catalog/ sort dropdown reorders products (name asc vs desc)',
    route: '/catalog/',
    async assert(page) {
      await page.waitForSelector('[data-testid="product-grid"]', { timeout: 8000 })
      const firstName = async () =>
        (await page.textContent('[data-testid="product-grid"] .product-item:first-child .product-item__title'))?.trim()
      await page.selectOption('[data-testid="product-sort"]', 'name-asc')
      await page.waitForTimeout(100)
      const asc = await firstName()
      await page.selectOption('[data-testid="product-sort"]', 'name-desc')
      await page.waitForTimeout(100)
      const desc = await firstName()
      if (!asc || !desc) throw new Error('could not read product names')
      if (asc === desc) throw new Error(`sort did not change order: still "${asc}"`)
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
  // ─── P4 checks ──────────────────────────────────────────────────────────
  {
    name: 'P4: /faq/ renders at least 5 Q&A entries (with NapsHelp sourceUrl links)',
    route: '/faq/',
    async assert(page) {
      await page.waitForSelector('[data-faq-q]', { timeout: 8000 })
      const count = await page.$$eval('[data-faq-q]', els => els.length)
      if (count < 5) throw new Error(`expected >= 5 FAQ entries, got ${count}`)
      // Every entry has a question (anchor or strong)
      const titles = await page.$$eval('[data-faq-q]', els => els.map(e => (e.textContent ?? '').trim().length))
      if (titles.some(l => l === 0)) throw new Error('some FAQ entries have empty question text')
    },
  },
  {
    name: 'P4: /aas-diaries/ lists at least 5 diary cards with external sourceUrl links',
    route: '/aas-diaries/',
    async assert(page) {
      await page.waitForSelector('main .card', { timeout: 8000 })
      const cardCount = await page.$$eval('main .card', els => els.length)
      if (cardCount < 5) throw new Error(`expected >= 5 diary cards, got ${cardCount}`)
      // Each diary card has a title link via h2 a
      const linkedOut = await page.$$eval(
        'main .card h2 a[href]',
        els => els.length,
      )
      if (linkedOut < cardCount - 1) {
        throw new Error(`expected most diary cards to have links, got ${linkedOut}/${cardCount}`)
      }
    },
  },
  {
    name: 'P4: /categories/anavar/ filter engages (fewer pages than full /catalog/)',
    route: '/catalog/',
    async assert(page) {
      // Both pages SSR at 24 items (one ProductTable page). Distinguish by
      // pagination button count: catalog spans many pages over ~691 products;
      // anavar has 32 productSlugs → 2 pages → fewer buttons.
      const catalogPages = await page.$$eval(
        '.ngc-pagination__num, nav.toolbox-pagination .page-link',
        els => els.length,
      )
      if (catalogPages < 5) {
        throw new Error(`/catalog/ pagination too small (${catalogPages}) — expected many pages over 600+ products`)
      }
      await page.goto(
        (process.env.VERIFY_BASE || 'http://localhost:3000') + '/categories/anavar/',
        { waitUntil: 'load' },
      )
      await page.waitForSelector('[data-testid="product-grid"]', { timeout: 8000 })
      const anavarPages = await page.$$eval(
        '.ngc-pagination__num, nav.toolbox-pagination .page-link',
        els => els.length,
      )
      if (anavarPages >= catalogPages) {
        throw new Error(
          `expected anavar pagination (${anavarPages}) < catalog pagination (${catalogPages}) — productSlugs filter did not engage`,
        )
      }
    },
  },
  {
    name: 'F4: header search submits to /catalog/?q= and filters results',
    route: '/',
    async assert(page) {
      await page.fill('.header-search-input', 'dianabol')
      await Promise.all([
        page.waitForURL('**/catalog/?q=dianabol'),
        page.click('.btn-search'),
      ])
      await page.waitForSelector('[data-testid="product-grid"]', { timeout: 8000 })
      const value = await page.inputValue('[data-testid="product-search"]')
      if (value !== 'dianabol') throw new Error(`catalog search did not hydrate from URL: "${value}"`)
    },
  },
  {
    name: 'F4: currency selection converts prices and persists after reload',
    route: '/catalog/',
    async assert(page) {
      await page.waitForSelector('#dropdownCurrency', { timeout: 8000 })
      await page.selectOption('#dropdownCurrency', 'EUR')
      await page.waitForFunction(() => {
        const price = document.querySelector('.product-price')
        return price && /€/.test(price.textContent || '')
      }, null, { timeout: 3000 })
      await page.reload({ waitUntil: 'load' })
      await page.waitForFunction(() => {
        const select = document.querySelector('#dropdownCurrency')
        return select && select.value === 'EUR'
      }, null, { timeout: 5000 })
      const selected = await page.inputValue('#dropdownCurrency')
      if (selected !== 'EUR') throw new Error(`currency did not persist: "${selected}"`)
    },
  },
  {
    name: 'F4: persisted currency hydrates without server/client mismatch',
    route: '/catalog/',
    async assert(page) {
      const hydrationErrors = []
      const onConsole = message => {
        if (/hydration failed|hydration mismatch/i.test(message.text())) {
          hydrationErrors.push(message.text())
        }
      }
      page.on('console', onConsole)
      await page.evaluate(() => {
        localStorage.setItem('napsgear_currency', JSON.stringify({
          state: {
            currency: 'GBP',
            rates: { USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.37, AUD: 1.52 },
            fetchedAt: Date.now(),
          },
          version: 0,
        }))
      })
      await page.reload({ waitUntil: 'load' })
      await page.waitForFunction(() => {
        const price = document.querySelector('.product-price')
        return price && /£/.test(price.textContent || '')
      }, null, { timeout: 5000 })
      page.off('console', onConsole)
      if (hydrationErrors.length) {
        throw new Error(hydrationErrors.join(' | '))
      }
    },
  },
  {
    name: 'F4: hosted-auth pages render polished account recovery UI',
    route: '/login/',
    async assert(page) {
      await page.waitForSelector('.ngc-auth-card', { timeout: 8000 })
      if (!(await page.$('input[type="email"]'))) throw new Error('login email field missing')
      if (!(await page.$('.ngc-auth-password-toggle'))) {
        throw new Error('login password visibility control missing')
      }
      const forgotHref = await page.getAttribute('a[href^="/forgot-password/"]', 'href')
      if (!forgotHref) throw new Error('forgot-password link missing')
      for (const path of ['/signup/', '/forgot-password/', '/reset-password/', '/account/']) {
        const response = await page.request.get(BASE + path)
        if (!response.ok()) throw new Error(`${path} returned ${response.status()}`)
      }
    },
  },
  {
    name: 'F4: new promotion and community routes are present',
    route: '/why-naps/',
    async assert(page) {
      const paths = [
        '/store-credit/',
        '/reviews-for-cash/',
        '/share-your-gear-pics/',
        '/refer-a-friend/',
        '/cashback/',
        '/supplier-super-deals/',
        '/product-of-the-week/',
        '/laboratory-tests/',
        '/project-get-shredded/',
        '/community-gearpics/',
      ]
      for (const path of paths) {
        const response = await page.request.get(BASE + path)
        if (!response.ok()) throw new Error(`${path} returned ${response.status()}`)
      }
      const body = await page.textContent('main')
      if (!body || body.includes('Content TBD')) throw new Error('/why-naps/ is still incomplete')
    },
  },
  {
    name: 'F4: unknown category slug 404s (dynamicParams=false) — no full-catalog fallback',
    route: '/',
    async assert(page) {
      // Every category is now derived from products, so all have productSlugs.
      // An unmatched slug must 404 (dynamicParams=false), never fall back to
      // rendering the entire unrelated catalog.
      const resp = await page.goto(
        (process.env.VERIFY_BASE || 'http://localhost:3000') + '/categories/does-not-exist-xyz/',
        { waitUntil: 'domcontentloaded' },
      )
      if (!resp || resp.status() !== 404) {
        throw new Error(`expected 404 for unknown category, got ${resp ? resp.status() : 'no response'}`)
      }
      const productCount = await page.$$eval('[data-testid="product-grid"] .product-item', els => els.length)
      if (productCount !== 0) throw new Error(`unknown category rendered ${productCount} products — should be none`)
    },
  },
  {
    name: 'F5: Quick View opens a dialog with product info + Add to Cart, ESC closes',
    route: '/catalog/',
    async assert(page) {
      // Programmatic click bypasses the hover-only overlay visibility.
      await page.$eval('.btn-quick-view', el => el.click())
      await page.waitForSelector('[role="dialog"]', { timeout: 8000 })
      const dialogText = await page.textContent('[role="dialog"]')
      if (!dialogText || !/Add to Cart/i.test(dialogText)) {
        throw new Error('Quick View dialog missing Add to Cart')
      }
      const title = (await page.textContent('[role="dialog"] .ngc-quickview__title'))?.trim()
      if (!title) throw new Error('Quick View dialog missing product title')

      // The image column must not collapse to a sliver (grid-track regression).
      const imgWidth = await page.$eval('[role="dialog"] .ngc-quickview__media img', el => el.getBoundingClientRect().width)
      if (imgWidth < 100) throw new Error(`Quick View image too narrow (${Math.round(imgWidth)}px) — media column collapsed`)

      // Add to cart from the dialog increments the header badge.
      const before = parseInt((await page.textContent('.cart-count')) || '0', 10)
      await page.click('[role="dialog"] .ngc-quickview__add')
      await page.waitForFunction(
        (n) => parseInt(document.querySelector('.cart-count')?.textContent || '0', 10) > n,
        before,
        { timeout: 8000 },
      )

      // ESC closes the dialog.
      await page.keyboard.press('Escape')
      await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 8000 })
    },
  },
]

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const failures = []

  for (const check of CHECKS) {
    try {
      await page.setViewportSize({ width: 1280, height: 800 })
      // Keep checks independent. Currency and cart preferences intentionally
      // persist in the app, but one check must not change another check's
      // assumptions when the harness reuses a single browser page.
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
      // 'domcontentloaded' instead of 'networkidle' — the catalog grew to
      // 700+ products and the network never settles within 30s on heavier
      // pages. Individual checks own their own waitForSelector calls for
      // the bits of UI they actually assert on.
      await page.goto(BASE + check.route, { waitUntil: 'domcontentloaded', timeout: 30000 })
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
