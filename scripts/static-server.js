const http = require('http'), fs = require('fs'), path = require('path')
const ROOT = process.argv[2] || './out', PORT = parseInt(process.argv[3] || '4173', 10)
const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2', '.txt':'text/plain' }
http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0])
  let fp = path.join(ROOT, url)
  try {
    let st = fs.statSync(fp)
    if (st.isDirectory()) fp = path.join(fp, 'index.html')
  } catch {
    if (!fp.endsWith('.html')) {
      try { fs.statSync(fp + '.html'); fp = fp + '.html' } catch {}
    }
  }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404') }
    res.writeHead(200, { 'content-type': mime[path.extname(fp)] || 'application/octet-stream' })
    res.end(data)
  })
}).listen(PORT, () => console.log('serving', ROOT, 'on', PORT))
