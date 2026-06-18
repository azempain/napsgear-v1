import * as fs from 'node:fs'
import * as path from 'node:path'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Download one image to an absolute dest path. Returns false on any failure
 *  (logged by caller). Skips if the file already exists. */
export async function downloadImage(remote: string, destAbs: string): Promise<boolean> {
  if (fs.existsSync(destAbs)) return true
  try {
    const res = await fetch(remote, {
      headers: { 'User-Agent': UA, Referer: 'https://ninegear.us/' },
    })
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    fs.mkdirSync(path.dirname(destAbs), { recursive: true })
    fs.writeFileSync(destAbs, buf)
    return true
  } catch {
    return false
  }
}
