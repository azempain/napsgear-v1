// Pure parse/transform layer for saved napsgear pages.
// No filesystem / network here — the CLI wrapper does I/O.

/** Last path segment of a product/detail URL, minus query/hash. */
export function slugFromUrl(url: string): string {
  const noHash = url.split('#')[0].split('?')[0]
  const path = noHash.replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '')
  const seg = path.split('/').filter(Boolean).pop() ?? ''
  return seg
}

/** Any image reference → /images/products/<basename>. */
export function localizeImage(src: string): string {
  if (src.startsWith('/images/products/')) return src
  const clean = src.split('#')[0].split('?')[0]
  const base = clean.split('/').pop() ?? ''
  return `/images/products/${base}`
}
