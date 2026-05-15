// Paste this in the browser console on https://www.napsgear.org/ask-an-ifbb-pro/
// It downloads videos.json to your Downloads folder.

(function extractVideos() {
  const results = []

  // Try all likely card containers
  const cardCandidates = [
    ...document.querySelectorAll('.post'),
    ...document.querySelectorAll('.video-item'),
    ...document.querySelectorAll('.ama-item'),
    ...document.querySelectorAll('article'),
  ]

  // Deduplicate by element identity
  const cards = [...new Set(cardCandidates)].filter(el => !el.closest('nav, footer, .sidebar'))

  for (const card of cards) {
    // Thumbnail: background-image style or <img>
    let thumbnail = ''
    const bgEl = card.querySelector('[style*="url("]') || (card.style?.backgroundImage ? card : null)
    if (bgEl) {
      const m = (bgEl.getAttribute('style') || bgEl.style.cssText || '').match(/url\(['"]?([^'")\s]+)['"]?\)/)
      if (m) thumbnail = m[1]
    }
    if (!thumbnail) {
      const img = card.querySelector('img')
      thumbnail = img?.dataset?.src || img?.src || ''
    }

    // Title
    const titleEl = card.querySelector('h2, h3, h4, .post-title, .entry-title, a[title]')
    const title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title') || ''

    // Date
    const dateEl = card.querySelector('time, .post-date, .entry-date, .date, small')
    const date = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''

    // URL
    const linkEl = card.querySelector('a[href]')
    let url = linkEl?.getAttribute('href') || '/ask-an-ifbb-pro/'
    if (url && !url.startsWith('http') && !url.startsWith('/')) url = '/' + url

    const isPremiere = /premiere/i.test(card.className + ' ' + (card.textContent || ''))

    if (thumbnail || title) {
      const video = { url, title, date, thumbnail }
      if (isPremiere) video.isPremiere = true
      results.push(video)
    }
  }

  console.log(`Found ${results.length} videos:`, results)

  // Download as JSON
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'videos.json'
  a.click()

  return results
})()
