import type { QaPost } from '@/data/types'

export default function QaPostCard({ post }: { post: QaPost }) {
  return (
    <article className="post mb-0 h-100">
      <div className="post-body">
        <div className="post-meta post-date">
          <small>{post.date}</small>
        </div>
        <div className="post-content mb-2">
          <a href={post.url}>{post.text}</a>
        </div>
        <a className="read-more" href={post.url} title="Read more">Read more</a>
      </div>
    </article>
  )
}
