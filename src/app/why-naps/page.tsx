import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Why NapsGear',
  description: 'Why customers choose NapsGear — service, selection, shipping.',
  alternates: { canonical: '/why-naps/' },
}

export default function WhyNapsPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">Why NapsGear</h1>
        <p className="text-muted">
          Content TBD — migrate from <code>offline/why-naps/index.html</code>.
        </p>
      </div>
    </main>
  )
}
