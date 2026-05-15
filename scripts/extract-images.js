// Paste this in the browser console on ANY napsgear.org page.
// It fetches all product images as blobs (same-origin, so no CORS block),
// converts them to base64, and downloads a single images-data.json file.
// Then run: node scripts/save-images.js  to write them to public/images/products/

(async function extractImages() {
  const urls = [
    "https://www.napsgear.org/images/catalog/23665/alpha-pharma-anazole.jpg",
    "https://www.napsgear.org/images/catalog/18073/alpha-pharma-androxine_amp.jpg",
    "https://www.napsgear.org/images/catalog/23623/alpha-pharma-boldebolin_amp.jpg",
    "https://www.napsgear.org/images/catalog/23626/alpha-pharma-boldebolin_vial.jpg",
    "https://www.napsgear.org/images/catalog/25447/alpha-pharma-induject_vial.jpg",
    "https://www.napsgear.org/images/catalog/23653/alpha-pharma-letromina.jpg",
    "https://www.napsgear.org/images/catalog/23674/alpha-pharma-mastoral10.jpg",
    "https://www.napsgear.org/images/catalog/23656/alpha-pharma-nandrobolin_vial.jpg",
    "https://www.napsgear.org/images/catalog/23662/alpha-pharma-nandrorapid_amp.jpg",
    "https://www.napsgear.org/images/catalog/23620/alpha-pharma-oxydrolone.jpg",
    "https://www.napsgear.org/images/catalog/23734/alpha-pharma-parabolin_amp.jpg",
    "https://www.napsgear.org/images/catalog/23/promifen.png",
    "https://www.napsgear.org/images/catalog/23635/alpha-pharma-rexobol_10.jpg",
    "https://www.napsgear.org/images/catalog/37557/alpha-pharma-rexobol-10.jpg",
    "https://www.napsgear.org/images/catalog/23641/alpha-pharma-rexobol50.jpg",
    "https://www.napsgear.org/images/catalog/23728/alpha-pharma-rexogin_amp.jpg",
    "https://www.napsgear.org/images/catalog/37560/alpha-pharma-testo_extend_1000mg_4ml.jpg",
    "https://www.napsgear.org/images/catalog/23701/alpha-pharma-testobolin_vial.jpg",
    "https://www.napsgear.org/images/catalog/23695/alpha-pharma-testocyp_amp.jpg",
    "https://www.napsgear.org/images/catalog/23713/alpha-pharma-testorapid_vial.jpg",
    "https://www.napsgear.org/images/catalog/23692/alpha-pharma-thyro3.jpg",
    "https://www.napsgear.org/images/catalog/23716/alpha-pharma-trenarapid_amp.jpg",
    "https://www.napsgear.org/images/catalog/23719/trenarapid.png",
    "https://www.napsgear.org/images/catalog/21/trenbolin_vial.jpg"
  ]

  const result = {}
  let done = 0

  for (const url of urls) {
    const filename = url.split('/').pop()
    try {
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(blob)
      })
      result[filename] = { base64, mime: blob.type }
      done++
      console.log(`[${done}/${urls.length}] ✓ ${filename}`)
    } catch (e) {
      console.warn(`✗ ${filename}: ${e.message}`)
    }
  }

  // Download as JSON
  const json = JSON.stringify(result, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'images-data.json'
  a.click()

  console.log(`\nDownloaded images-data.json with ${done} images.`)
  console.log('Now run: node scripts/save-images.js')
})()
