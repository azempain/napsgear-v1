'use client'
import { useStore } from '@tanstack/react-store'
import type { QaPost } from '@/data/types'
import { filterByCategory, sortByDate, QA_CATEGORIES, type QaSort } from '@/lib/qa'
import QaPostCard from './QaPostCard'
import { componentUiStore } from '@/store/componentUiStore'

export default function QaForum({ posts }: { posts: QaPost[] }) {
  const { category, sort } = useStore(componentUiStore, state => state.qaForum)

  const visible = sortByDate(filterByCategory(posts, category), sort)

  return (
    <div className="qa-forum">
      <div className="qa-filter-bar d-flex flex-wrap gap-2 mb-4">
        <select
          className="form-select"
          style={{ maxWidth: 240 }}
          value={category}
          onChange={e => componentUiStore.actions.setQaCategory(e.target.value)}
          aria-label="Filter by category"
        >
          {QA_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={sort}
          onChange={e => componentUiStore.actions.setQaSort(e.target.value as QaSort)}
          aria-label="Sort order"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <h2 className="section-title m-b-4">Recently asked questions:</h2>

      {visible.length === 0 ? (
        <p className="text-muted">No questions in this category yet.</p>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 g-3">
          {visible.map(p => (
            <div key={p.id} id={`post-${p.id}`} className="col">
              <QaPostCard post={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
