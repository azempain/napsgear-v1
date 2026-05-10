import type { Video } from '@/data/types'

export default function VideoCard({ video }: { video: Video }) {
  return (
    <article className="post overflow-hidden rounded border border-gray-200 bg-white">
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="aspect-video w-full bg-gray-100" aria-hidden="true" />
      )}
      <div className="p-3">
        <h3 className="post-title line-clamp-2 text-sm font-medium">
          <a href={video.url}>{video.title}</a>
        </h3>
        {video.date && (
          <time className="post-date mt-1 block text-xs text-gray-500">{video.date}</time>
        )}
      </div>
    </article>
  )
}
