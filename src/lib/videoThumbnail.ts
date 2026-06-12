const VIMEO_FILE = /(?:^|\/)(\d+-[a-f0-9]+-d_960x540)(?:$|[/?])/i

export function normalizeVideoThumbnail(src: string) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src

  const match = src.match(VIMEO_FILE)
  return match
    ? `https://i.vimeocdn.com/video/${match[1]}?r=pad&region=us`
    : src.startsWith('/') ? src : `/${src.replace(/^\.?\//, '')}`
}
