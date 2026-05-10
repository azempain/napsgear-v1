import type { Video } from '@/data/types'

export default function AmaPremiereCard({ video }: { video: Video }) {
  return (
    <article className="post post--premiere mb-0 h-100">
      <figure className="post-media">
        <a
          href={video.url}
          title={video.title}
          className="post-image d-block ratio ratio-16x9"
          style={{ '--post-thumb': `url('${video.thumbnail}')` } as React.CSSProperties}
        >
          <div className="premiere-badge">PREMIERE</div>
        </a>
      </figure>
      <div className="post-body post-body--premiere">
        <div className="premiere-date">{video.date}</div>
        <a className="premiere-title" title={video.title} href={video.url}>{video.title}</a>
        {video.description && (
          <p className="premiere-description">{video.description}</p>
        )}
      </div>
    </article>
  )
}
