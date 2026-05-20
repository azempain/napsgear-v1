;(() => {
  const s = JSON.parse(localStorage.getItem('naps_progress') || '{}')
  const products = Object.values(s.products || {})
  const ingSeen = new Set(), ing = []
  for (const it of (s.ingredients || [])) {
    const k = `${it.brand}::${it.id}`
    if (!ingSeen.has(k)) { ingSeen.add(k); ing.push(it) }
  }
  const dl = (n, o) => {
    const b = new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = n
    a.click()
  }
  dl('products.json', products)
  setTimeout(() => dl('ingredients.json', ing), 250)
  console.log(`${products.length} products, ${ing.length} ingredients, ${Object.keys(s.enriched || {}).length} enriched`)
})()
