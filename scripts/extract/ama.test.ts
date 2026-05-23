import { describe, it, expect } from 'vitest'
import { extractVideos } from './ama'

const HTML = `
<html><body>
  <div class="video-item">
    <div class="video-item__thumbnail">
      <a href="https://www.napsgear.org/ama.php?vId=4893">
        <img class="video_tb" src="./ama_files/abc123.jpg" data-video="4893" data-hash-vimeo="1191979287" />
      </a>
      <div class="video-item__duration">01:16:46</div>
    </div>
    <div class="video-item__media">
      <a class="video-item__link" href="https://www.napsgear.org/ama.php?vId=4893" title="Are You Training Too Hard to Actually Recover and Grow?">
        <span class="video-item_title">Are You Training Too Hard to Actually Recover and Grow?</span>
      </a>
      <div class="video-item__meta">
        <small class="date-added"> Added: 13 hours ago</small>
      </div>
    </div>
  </div>
  <div class="video-item">
    <div class="video-item__thumbnail">
      <a href="https://www.napsgear.org/ama.php?vId=4920">
        <img class="video_tb" src="./ama_files/xyz789.jpg" />
      </a>
    </div>
    <div class="video-item__media">
      <a class="video-item__link" href="https://www.napsgear.org/ama.php?vId=4920" title="Milos Sarcev on the REAL Reason">
        <span class="video-item_title">Milos Sarcev on the REAL Reason</span>
      </a>
      <div class="video-item__meta">
        <small class="date-added"> Added: 1 day ago</small>
      </div>
    </div>
  </div>
</body></html>
`

describe('extractVideos', () => {
  const vids = extractVideos(HTML)

  it('returns one Video per .video-item card', () => {
    expect(vids).toHaveLength(2)
  })

  it('parses url, title, thumbnail, date', () => {
    expect(vids[0]).toMatchObject({
      url: 'https://www.napsgear.org/ama.php?vId=4893',
      title: 'Are You Training Too Hard to Actually Recover and Grow?',
      thumbnail: './ama_files/abc123.jpg',
      date: '13 hours ago',
    })
  })

  it('captures the second video as well', () => {
    expect(vids[1].url).toBe('https://www.napsgear.org/ama.php?vId=4920')
    expect(vids[1].title).toBe('Milos Sarcev on the REAL Reason')
    expect(vids[1].date).toBe('1 day ago')
  })

  it('skips video-items missing a url or title', () => {
    const empty = extractVideos('<html><body><div class="video-item"></div></body></html>')
    expect(empty).toEqual([])
  })
})
