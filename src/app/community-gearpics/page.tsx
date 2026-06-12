import type { Metadata } from 'next'
import { gearpics } from '@/data'

export const metadata: Metadata = { title: 'Community Gear Pics', alternates: { canonical: '/community-gearpics/' } }

export default function CommunityGearpicsPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-2">Community Gear Pics</h1>
        <p className="text-muted mb-4">Recent customer photo submissions.</p>
        <div className="ngc-gallery">
          {gearpics.map(item => (
            <article key={item.id} id={`gear-${item.id}`} className="ngc-gallery__item">
              <img src={item.thumb} alt={item.title} />
              <div><time>{item.date}</time><h2>{item.title}</h2></div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
