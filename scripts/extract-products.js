// Paste this in the browser console on any napsgear.org catalog/brand/category page.
// It downloads products.json (or appends if run multiple times).
// Run on each brand/category page you want to capture.

(function extractProducts() {
  const results = []

  // Try all likely product card containers
  const selectors = [
    '.product-item', '.product-card', '.catalog-item',
    'li.item', '.product', '.item-inner',
  ]

  const cards = []
  const seen = new Set()
  for (const sel of selectors) {
    for (const el of document.querySelectorAll(sel)) {
      if (!seen.has(el) && !el.closest('nav, footer, .sidebar, header')) {
        seen.add(el)
        cards.push(el)
      }
    }
  }

  for (const card of cards) {
    // Name
    const nameEl = card.querySelector(
      '.product-name, .product-title, h2, h3, h4, .name, a.product-link'
    )
    const name = nameEl?.textContent?.trim() || ''
    if (!name) continue

    // Images
    const images = []
    card.querySelectorAll('img').forEach(img => {
      const src = img.dataset.src || img.src || ''
      if (src && !src.includes('placeholder') && !images.includes(src)) images.push(src)
    })

    // URL → slug
    const linkEl = card.querySelector('a[href]')
    const href = linkEl?.getAttribute('href') || ''
    const slug = href
      .replace(/.*\/([^/?#]+)\/?(\?.*)?$/, '$1')
      .replace(/\.html$/, '') ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Description
    const descEl = card.querySelector('.short-description, .description, p')
    const description = descEl?.textContent?.trim() || ''

    // Price
    const priceEl = card.querySelector('.price, .product-price, .regular-price, .special-price')
    const price = priceEl?.textContent?.trim() || ''

    // Brand (from badge or parent context)
    const brandEl = card.querySelector('.brand, .manufacturer, [class*="brand"]')
    const brand = brandEl?.textContent?.trim() || ''

    results.push({ slug, name, description, brand, price, images })
  }

  console.log(`Found ${results.length} products on this page:`, results)

  // Merge with any previously captured data stored in sessionStorage
  const stored = JSON.parse(sessionStorage.getItem('naps_products') || '[]')
  const merged = [...stored, ...results].filter((p, i, arr) =>
    arr.findIndex(x => x.slug === p.slug) === i
  )
  sessionStorage.setItem('naps_products', JSON.stringify(merged))
  console.log(`Total captured so far: ${merged.length}`)

  // Download current merged set
  const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'products.json'
  a.click()

  return merged
})()
