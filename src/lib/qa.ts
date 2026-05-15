import type { QaPost } from '@/data/types'

export const QA_CATEGORIES = [
  'All categories',
  'General Questions',
  'Gear Talk',
  'Training, Nutrition & Diet',
  'NapsGear Products',
] as const

export type QaSort = 'newest' | 'oldest'

export function filterByCategory(posts: QaPost[], category: string): QaPost[] {
  if (category === 'All categories') return posts
  return posts.filter(p => p.category === category)
}

export function sortByDate(posts: QaPost[], sort: QaSort): QaPost[] {
  return [...posts].sort((a, b) => {
    const da = new Date(a.date).getTime()
    const db = new Date(b.date).getTime()
    return sort === 'newest' ? db - da : da - db
  })
}
