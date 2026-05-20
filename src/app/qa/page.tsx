import type { Metadata } from 'next'
import { qaPosts } from '@/data'
import QaForum from '@/components/QaForum'

export const metadata: Metadata = {
  title: 'Q & A',
  description: 'Community questions and answers about training, cycles, and ordering.',
  alternates: { canonical: '/qa/' },
}

export default function QaPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-2">NapsGear Q &amp; A</h1>
        <p className="text-muted mb-4">Questions &amp; Answers with NapsGear Customers</p>

        <div className="qa-explainer rounded border p-3 mb-4">
          <h2 className="section-title">What is Customer Questions &amp; Answers?</h2>
          <p className="m-0">
            NapsGear&apos;s &quot;Questions &amp; Answers&quot; lets you connect with
            customers, earn store credit for helpful answers, and vote on the best
            responses. Top-rated answers receive $2 store credit. Self-voting and
            creating multiple accounts for voting are prohibited.
          </p>
        </div>

        <QaForum posts={qaPosts} />
      </div>
    </main>
  )
}
