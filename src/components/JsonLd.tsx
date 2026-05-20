// Server-renders one or more schema.org blobs into <script type="application/ld+json">.
// Server component — no 'use client' — so the markup ships in the SSG HTML
// and crawlers pick it up without executing JS.

export default function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data)
  // CSP-safe: type="application/ld+json" is never executed as script.
  // We replace "</" to defang any HTML-injection edge case inside string fields.
  const safe = json.replace(/<\//g, '<\\/')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
