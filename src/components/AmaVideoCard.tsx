import type { Video } from '@/data/types'

export default function AmaVideoCard({ video }: { video: Video }) {
  return (
    <article className="post mb-0 h-100">
      <figure className="post-media">
        <a
          href={video.url}
          title={video.title}
          className="post-image d-block ratio ratio-16x9"
          style={{ '--post-thumb': `url('${video.thumbnail}')` } as React.CSSProperties}
        />
      </figure>
      <div className="post-body">
        <div className="post-meta"><small>{video.date}</small></div>
        <a title={video.title} href={video.url}>{video.title}</a>
      </div>
    </article>
  )
}
