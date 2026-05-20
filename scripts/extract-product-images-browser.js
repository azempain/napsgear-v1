// Paste this in DevTools console on any napsgear.org page.
//
// Reads the products you already extracted (from localStorage), fetches every
// product image via your Edge session (which is past Cloudflare), and
// streams the results out as chunked images-data-NNN.json downloads.
//
// localStorage holds ONLY a small "completion" set — never the raw image
// bytes — so quota (~5MB) is never a concern even at 700+ images.
//
// Pacing: 700ms per image, with 15s/45s/90s backoff on 403/429.
// Chunk size: 60 images per file (~2MB each, opens fine in editors).
//
// Reset:   localStorage.removeItem('naps_image_progress')
// Abort:   window.__napsAbort = true

;(async () => {
  const BASE = 'https://www.napsgear.org'
  const STATE_KEY = 'naps_image_progress'
  const PER_IMAGE_DELAY = 700
  const CHUNK_SIZE = 60
  const sleep = ms => new Promise(r => setTimeout(r, ms))

  // 1) Build work-list from the scraper's saved state.
  const scrape = JSON.parse(localStorage.getItem('naps_progress') || '{}')
  const products = Object.values(scrape.products || {})
  if (!products.length) {
    console.error('No products in localStorage["naps_progress"]. Run extract-all-browser.js first.')
    return
  }
  function remoteUrlFor(slug, basename) {
    const m = slug?.match(/-p(\d+)$/)
    return m ? `${BASE}/images/catalog/${m[1]}/${basename}` : null
  }
  const work = []
  const seen = new Set()
  for (const p of products) {
    for (const img of (p.images || [])) {
      const filename = img.split('/').pop()
      if (!filename || seen.has(filename)) continue
      const url = img.startsWith('http') ? img : remoteUrlFor(p.slug, filename)
      if (!url) continue
      seen.add(filename)
      work.push({ url, filename })
    }
  }
  console.log(`%c🖼  ${work.length} unique images to fetch`, 'color:#0089cb;font-weight:bold')

  // 2) Completion state — just filenames, no bytes
  const state = (() => {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null')
      if (s && s.done && typeof s.chunkIndex === 'number') {
        console.log(`%c↻  Resuming: ${Object.keys(s.done).length} already saved, next chunk #${s.chunkIndex}`, 'color:#a07c00')
        return s
      }
    } catch {}
    return { done: {}, chunkIndex: 1 }
  })()
  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)) } catch {}
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result.toString().split(',')[1])
      r.onerror = () => reject(r.error)
      r.readAsDataURL(blob)
    })
  }

  async function fetchImage(url, attempt = 1) {
    const res = await fetch(url, { credentials: 'include' })
    if (res.status === 403 || res.status === 429) {
      if (attempt <= 3) {
        const wait = [15, 45, 90][attempt - 1] * 1000
        console.warn(`   ⏳  ${res.status} — back off ${wait/1000}s (${url})`)
        await sleep(wait)
        return fetchImage(url, attempt + 1)
      }
      throw new Error(`HTTP ${res.status} after backoff`)
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.blob()
  }

  function downloadChunk(images) {
    if (!Object.keys(images).length) return
    const idx = String(state.chunkIndex).padStart(3, '0')
    const blob = new Blob([JSON.stringify(images)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `images-data-${idx}.json`
    a.click()
    state.chunkIndex++
    saveState()
  }

  // 3) Crawl, accumulating up to CHUNK_SIZE images in memory, then flushing.
  const remaining = work.filter(w => !state.done[w.filename])
  console.log(`   ${remaining.length} to download (${work.length - remaining.length} already saved)`)

  let buffer = {}
  let ok = 0, fail = 0

  for (let i = 0; i < remaining.length; i++) {
    if (window.__napsAbort) { console.warn('Aborted — re-paste to resume.'); break }
    const { url, filename } = remaining[i]
    try {
      const blob = await fetchImage(url)
      const base64 = await blobToBase64(blob)
      buffer[filename] = { base64, mime: blob.type || 'image/jpeg' }
      state.done[filename] = true
      ok++
    } catch (e) {
      console.warn(`   ${filename}: ${e.message}`)
      fail++
    }
    if (Object.keys(buffer).length >= CHUNK_SIZE) {
      downloadChunk(buffer)
      buffer = {}
    }
    if ((i + 1) % 20 === 0 || i === remaining.length - 1) {
      saveState()
      console.log(`   ${i + 1}/${remaining.length} (ok=${ok}, fail=${fail})`)
    }
    await sleep(PER_IMAGE_DELAY)
  }

  // Flush trailing buffer
  downloadChunk(buffer)
  saveState()

  console.log(`%c✅  ${ok} downloaded, ${fail} failed. Chunked .json files in your Downloads folder.`, 'color:#16a34a;font-weight:bold')
  console.log('   Next: move all images-data-*.json into ./tmp/ and run:')
  console.log('     node scripts/save-images.js  (will glob the chunks)')
})()
