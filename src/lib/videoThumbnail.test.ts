import { describe, expect, it } from 'vitest'
import { normalizeVideoThumbnail } from './videoThumbnail'

describe('normalizeVideoThumbnail', () => {
  it('rewrites scraped Vimeo paths to the CDN', () => {
    expect(normalizeVideoThumbnail(
      './NapsGear - ama_files/2157838439-53846a424fc81dec7af2ba096e2d443620fca153576bdc4aa13ad011e848611d-d_960x540',
    )).toBe(
      'https://i.vimeocdn.com/video/2157838439-53846a424fc81dec7af2ba096e2d443620fca153576bdc4aa13ad011e848611d-d_960x540?r=pad&region=us',
    )
  })

  it('leaves absolute URLs unchanged', () => {
    expect(normalizeVideoThumbnail('https://example.com/thumb.jpg')).toBe('https://example.com/thumb.jpg')
  })
})
