import { describe, it, expect } from 'vitest'
import { extractDiaries } from './diaries'

const HTML = `
<html><body>
  <div class="aas-diaries-page">
    <div class="aas-item">
      <div class="aas-item__author">By: Anon_SA</div>
      <figure>
        <a href="https://www.napsgear.org/aas_diaries.php?id=8481" title="Year of gaining ">
          <img src="./diaries_files/abc.jpg" alt="Year of gaining " />
        </a>
      </figure>
      <div class="aas-item__content">
        <h4><a href="https://www.napsgear.org/aas_diaries.php?id=8481" title="Open AAS diary">Year of gaining </a></h4>
        <div class="post-meta mb-1 aas-date">
          <small>Last updated: 14 hours ago</small>
        </div>
        <div class="aas-text">
          Year 3 of trying to be a more fit father.
        </div>
      </div>
    </div>
    <div class="aas-item">
      <div class="aas-item__author">By: Lifter42</div>
      <figure>
        <a href="https://www.napsgear.org/aas_diaries.php?id=8493" title="Oscars Cutting cycle">
          <img src="./diaries_files/no-image.jpg" alt="Oscars Cutting cycle" />
        </a>
      </figure>
      <div class="aas-item__content">
        <h4><a href="https://www.napsgear.org/aas_diaries.php?id=8493" title="Open AAS diary">Oscars Cutting cycle</a></h4>
        <div class="post-meta mb-1 aas-date">
          <small>Last updated: 1 week ago</small>
        </div>
        <div class="aas-text">Cutting season time.</div>
      </div>
    </div>
  </div>
</body></html>
`

describe('extractDiaries', () => {
  const diaries = extractDiaries(HTML)

  it('returns one entry per .aas-item card', () => {
    expect(diaries).toHaveLength(2)
  })

  it('parses title (trimmed), author (without "By:" prefix), date, excerpt', () => {
    expect(diaries[0]).toMatchObject({
      title: 'Year of gaining',
      author: 'Anon_SA',
      date: '14 hours ago',
      excerpt: 'Year 3 of trying to be a more fit father.',
    })
  })

  it('captures sourceUrl from the title anchor and derives a slug from it', () => {
    expect(diaries[0].sourceUrl).toBe('https://www.napsgear.org/aas_diaries.php?id=8481')
    // slug = the id from the query string
    expect(diaries[0].slug).toBe('8481')
  })

  it('captures thumbnail path (shell rewrites later)', () => {
    expect(diaries[0].thumbnail).toBe('./diaries_files/abc.jpg')
  })

  it('does NOT emit bodyHtml when the saved page only carries excerpts', () => {
    expect(diaries[0].bodyHtml).toBeUndefined()
  })
})
