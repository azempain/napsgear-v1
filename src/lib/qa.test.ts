import { describe, it, expect } from 'vitest'
import { filterByCategory, sortByDate } from './qa'
import type { QaPost } from '@/data/types'

const posts: QaPost[] = [
  { id: '1', date: 'May 9, 2026', text: 'a', url: '#', category: 'Gear Talk' },
  { id: '2', date: 'May 11, 2026', text: 'b', url: '#', category: 'General Questions' },
  { id: '3', date: 'May 10, 2026', text: 'c', url: '#' }, // no category
]

describe('qa filter/sort', () => {
  it('returns all posts when category is "All categories"', () => {
    expect(filterByCategory(posts, 'All categories')).toHaveLength(3)
  })
  it('filters to a specific category', () => {
    const r = filterByCategory(posts, 'Gear Talk')
    expect(r).toHaveLength(1)
    expect(r[0].id).toBe('1')
  })
  it('excludes posts without a category when a specific one is selected', () => {
    expect(filterByCategory(posts, 'General Questions').map(p => p.id)).toEqual(['2'])
  })
  it('sorts newest first', () => {
    expect(sortByDate(posts, 'newest').map(p => p.id)).toEqual(['2', '3', '1'])
  })
  it('sorts oldest first', () => {
    expect(sortByDate(posts, 'oldest').map(p => p.id)).toEqual(['1', '3', '2'])
  })
  it('does not mutate the input array', () => {
    const copy = [...posts]
    sortByDate(posts, 'newest')
    expect(posts).toEqual(copy)
  })
})
