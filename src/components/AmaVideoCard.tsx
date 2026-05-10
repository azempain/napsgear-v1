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
      {(video.title || video.date) && (
        <div className="post-body">
          {video.date && <div className="post-meta"><small>{video.date}</small></div>}
          {video.title && <a title={video.title} href={video.url}>{video.title}</a>}
        </div>
      )}
    </article>
  )
}
