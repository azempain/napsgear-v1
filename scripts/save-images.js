// Run AFTER downloading images-data.json from the browser:
//   node scripts/save-images.js ~/Downloads/images-data.json
// Writes images to public/images/products/ and updates products.json paths.

const fs = require('fs')
const path = require('path')

const jsonPath = process.argv[2] || path.join(require('os').homedir(), 'Downloads', 'images-data.json')
const OUT_DIR = path.join(__dirname, '../public/images/products')
const PRODUCTS_PATH = path.join(__dirname, '../src/data/products.json')

if (!fs.existsSync(jsonPath)) {
  console.error(`images-data.json not found at: ${jsonPath}`)
  console.error('Usage: node scripts/save-images.js <path/to/images-data.json>')
  process.exit(1)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
let saved = 0

for (const [filename, { base64 }] of Object.entries(data)) {
  const dest = path.join(OUT_DIR, filename)
  fs.writeFileSync(dest, Buffer.from(base64, 'base64'))
  console.log(`  saved: ${filename}`)
  saved++
}

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
