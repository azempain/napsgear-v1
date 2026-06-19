// Shared slug helper for the build-time extractors/fetchers. Collapses any run
// of non-alphanumerics to a single hyphen and trims edge hyphens. One source of
// truth so brand/category/faq/promotion slugs can never drift apart.
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
