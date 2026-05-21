// Pure helpers for image-path manipulation. Kept outside the React tree so
// they can be unit-tested in Node.

const RASTER_RE = /^(.*)\.(jpe?g|png)$/i

/** Derive a sibling .webp path for any raster src. Returns null when the src
 *  isn't a recognized raster extension (already .webp, .svg, .gif) or when
 *  it's an absolute external URL — in those cases we don't have a companion
 *  emitted by scripts/optimize-images.ts and should skip the <source>. */
export function toWebpSource(src: string): string | null {
  if (!src) return null
  if (/^https?:\/\//i.test(src)) return null
  const m = src.match(RASTER_RE)
  if (!m) return null
  return `${m[1]}.webp`
}
