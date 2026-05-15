// node scripts/extract-page-content.js "<saved html file>" [maxChars]
const fs = require('fs')
const path = require('path')

const file = process.argv[2]
const max = parseInt(process.argv[3] || '4000', 10)

let h = fs.readFileSync(file, 'utf8')
h = h.replace(/<script[\s\S]*?<\/script>/g, '')
     .replace(/<style[\s\S]*?<\/style>/g, '')
     .replace(/<!--[\s\S]*?-->/g, '')

const m = h.match(/<main[\s\S]*?<\/main>/)
let b = m ? m[0] : h

b = b.replace(/<h([1-6])[^>]*>/g, '\n### ')
b = b.replace(/<li[^>]*>/g, '\n- ')
b = b.replace(/<\/(h[1-6]|p|li|div|section|tr|td|th)>/g, '\n')
b = b.replace(/<br\s*\/?>/g, '\n')
b = b.replace(/<[^>]+>/g, ' ')

const ent = {
  '&amp;': '&', '&#39;': "'", '&quot;': '"', '&nbsp;': ' ',
  '&lt;': '<', '&gt;': '>', '&rsquo;': "'", '&lsquo;': "'",
  '&ldquo;': '"', '&rdquo;': '"', '&hellip;': '...', '&mdash;': '-',
}
for (const [k, v] of Object.entries(ent)) b = b.split(k).join(v)
b = b.replace(/�/g, "'")

b = b.split('\n')
     .map(l => l.replace(/\s+/g, ' ').trim())
     .filter(l => l.length > 1)
     .join('\n')
     .replace(/\n{3,}/g, '\n\n')

process.stdout.write(b.slice(0, max))
