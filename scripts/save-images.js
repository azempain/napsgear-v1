// Run AFTER downloading images-data*.json from the browser:
//   node scripts/save-images.js                            (auto: ~/Downloads/images-data*.json)
//   node scripts/save-images.js ./tmp/                     (directory: globs images-data*.json inside)
//   node scripts/save-images.js a.json b.json              (explicit files)
// Writes images to public/images/products/ and updates products.json paths.

const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '../public/images/products')
const PRODUCTS_PATH = path.join(__dirname, '../src/data/products.json')
const DOWNLOADS = path.join(require('os').homedir(), 'Downloads')

// Resolve input arg(s) → list of JSON file paths
function resolveInputs(args) {
  if (!args.length) {
    // Default: Downloads/images-data*.json (sorted)
    return fs.readdirSync(DOWNLOADS)
      .filter(f => /^images-data.*\.json$/i.test(f))
      .sort()
      .map(f => path.join(DOWNLOADS, f))
  }
  const out = []
  for (const a of args) {
    if (!fs.existsSync(a)) {
      console.error(`Not found: ${a}`); process.exit(1)
    }
    const stat = fs.statSync(a)
    if (stat.isDirectory()) {
      out.push(...fs.readdirSync(a)
        .filter(f => /^images-data.*\.json$/i.test(f))
        .sort()
        .map(f => path.join(a, f)))
    } else {
      out.push(a)
    }
  }
  return out
}

const inputs = resolveInputs(process.argv.slice(2))
if (!inputs.length) {
  console.error('No images-data*.json files found.')
  console.error('Usage: node scripts/save-images.js [<dir or file> ...]')
  process.exit(1)
}
console.log(`Loading ${inputs.length} chunk file(s):`)
inputs.forEach(p => console.log(`  · ${p}`))

fs.mkdirSync(OUT_DIR, { recursive: true })

let saved = 0, skipped = 0
for (const jsonPath of inputs) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  for (const [filename, entry] of Object.entries(data)) {
    const base64 = entry?.base64 ?? entry
    if (typeof base64 !== 'string') continue
    const dest = path.join(OUT_DIR, filename)
    if (fs.existsSync(dest)) { skipped++; continue }
    fs.writeFileSync(dest, Buffer.from(base64, 'base64'))
    saved++
  }
}
console.log(`\n${saved} new images written, ${skipped} already existed.`)

// Update products.json to point to local paths
const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'))
for (const product of products) {
  product.images = product.images.map(img => {
    const filename = img.split('/').pop()
    const localPath = `/images/products/${filename}`
    const exists = fs.existsSync(path.join(OUT_DIR, filename))
    return exists ? localPath : img
  })
}
fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2))

console.log(`\nSaved ${saved} images → public/images/products/`)
console.log('products.json updated with local paths.')
