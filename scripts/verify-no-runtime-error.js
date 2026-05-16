// node scripts/verify-no-runtime-error.js
// Loads key routes in real Chromium, captures page errors / unhandled
// rejections, and fails if the webpack "reading 'call'" TypeError appears.

const { chromium } = require('playwright')

const BASE = 'http://localhost:3000'
const ROUTES = ['/', '/faq/', '/references/', '/shipping-information/', '/qa/', '/cart/', '/ask-an-ifbb-pro/']
const SIGNATURE = "Cannot read properties of undefined (reading 'call')"

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const hits = []

  page.on('pageerror', err => {
    if (err.message && err.message.includes(SIGNATURE)) hits.push({ kind: 'pageerror', msg: err.message })
  })
  page.on('console', msg => {
    const t = msg.text()
    if (t.includes(SIGNATURE)) hits.push({ kind: 'console', msg: t })
  })

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 })
    // give the deferred offline scripts + dynamic imports time to run/reject
    await page.waitForTimeout(2500)
    console.log(`  loaded ${route}`)
  }

  await browser.close()

  if (hits.length) {
    console.log(`\n❌ FAIL — ${hits.length} matching error(s):`)
    hits.forEach(h => console.log(`   [${h.kind}] ${h.msg}`))
    process.exit(1)
  }
  console.log(`\n✅ PASS — no "${SIGNATURE}" across ${ROUTES.length} routes`)
})().catch(e => { console.error('verify error:', e.message); process.exit(2) })
