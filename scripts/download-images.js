// node scripts/download-images.js
// Downloads all product images to public/images/products/ and rewrites products.json.

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const PRODUCTS_PATH = path.join(__dirname, '../src/data/products.json')
const OUT_DIR = path.join(__dirname, '../public/images/products')
fs.mkdirSync(OUT_DIR, { recursive: true })

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        'Referer': 'https://www.napsgear.org/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        fs.unlinkSync(dest)
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    })
    req.on('error', (e) => { fs.unlink(dest, () => {}); reject(e) })
  })
}

// napsgear catalog images live at:
//   https://www.napsgear.org/images/catalog/<productId>/<basename>
// where <productId> is the trailing -p<digits> in the product slug.
// Rebuild that URL when the JSON only carries a local /images/products/ path.
function remoteUrlFor(product, basename) {
  const m = product.slug?.match(/-p(\d+)$/)
  if (!m) return null
  return `https://www.napsgear.org/images/catalog/${m[1]}/${basename}`
}

;(async () => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'))
  let changed = 0
  let failed = 0

  for (const product of products) {
    const newImages = []
    for (const imgUrl of product.images) {
      if (!imgUrl) { newImages.push(imgUrl); continue }

      // Figure out (a) the filename to save as, (b) the remote URL to fetch.
      let filename, remote
      if (imgUrl.startsWith('/images/products/')) {
        filename = path.basename(imgUrl)
        remote = remoteUrlFor(product, filename)
      } else if (imgUrl.startsWith('/')) {
        // Other site-relative path — skip, can't reconstruct
        newImages.push(imgUrl); continue
      } else {
        try { filename = path.basename(new URL(imgUrl).pathname) }
        catch { newImages.push(imgUrl); continue }
        remote = imgUrl
      }
      if (!filename) { newImages.push(imgUrl); continue }
      const localPath = path.join(OUT_DIR, filename)
      const publicPath = `/images/products/${filename}`

      if (fs.existsSync(localPath)) {
        newImages.push(publicPath)
        continue
      }
      if (!remote) {
        // Couldn't build a URL (no -p<id> in slug). Leave path as-is.
        newImages.push(imgUrl); continue
      }

      process.stdout.write(`  ${product.slug}: ${filename} ... `)
      try {
        await download(remote, localPath)
        console.log('ok')
        newImages.push(publicPath)
        changed++
      } catch (e) {
        console.log(`FAILED (${e.message})`)
        newImages.push(imgUrl)
        failed++
      }
    }
    product.images = newImages
  }

  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2))
  console.log(`\nDone. ${changed} downloaded, ${failed} failed. products.json updated.`)
})()
