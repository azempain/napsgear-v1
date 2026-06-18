import * as fs from 'node:fs'
import * as path from 'node:path'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Download one image to an absolute dest path. Returns false after all
 *  retries fail (logged by caller). Skips if the file already exists.
 *  Retries transient failures (resets/throttling seen during bulk runs). */
export async function downloadImage(
  remote: string,
  destAbs: string,
  attempts = 3,
): Promise<boolean> {
  if (fs.existsSync(destAbs)) return true
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(remote, {
        headers: { 'User-Agent': UA, Referer: 'https://ninegear.us/' },
      })
      if (!res.ok) {
        if (res.status === 404) return false // permanent — don't retry
        throw new Error(`HTTP ${res.status}`)
      }
      const buf = Buffer.from(await res.arrayBuffer())
      fs.mkdirSync(path.dirname(destAbs), { recursive: true })
      fs.writeFileSync(destAbs, buf)
      return true
    } catch {
      if (attempt >= attempts) return false
      await new Promise((r) => setTimeout(r, 400 * attempt))
    }
  }
  return false
}
