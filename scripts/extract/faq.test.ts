import { describe, it, expect } from 'vitest'
import { extractFaq } from './faq'

// Fixture mirrors the actual NapsHelp KB page structure: each category is a
// .dialog-block with a .dialog-block-title link (category name + slug) and a
// .dialog-block-body .list-kb ul of question-only links pointing at NapsHelp.
const FAQ_HTML = `
<html><body>
  <div class="dialog-block">
    <div class="dialog-block-title">
      <a id="contact-us" class="link-icon" href="https://napshelp.com/index.php?/Knowledgebase/List/Index/11/contact-us">Contact Us</a>
      <span class="kbcategorycount pull-right">1</span>
    </div>
    <div class="dialog-block-body clearfix">
      <ul class="list-unstyled list-kb">
        <li><a href="https://napshelp.com/index.php?/Knowledgebase/Article/View/95/11/how-do-i-contact-naps">How do I contact Naps?</a></li>
      </ul>
    </div>
  </div>
  <div class="dialog-block">
    <div class="dialog-block-title">
      <a id="my-account" class="link-icon" href="https://napshelp.com/index.php?/Knowledgebase/List/Index/5/my-account">My Account</a>
    </div>
    <div class="dialog-block-body clearfix">
      <ul class="list-unstyled list-kb">
        <li><a href="https://napshelp.com/index.php?/Knowledgebase/Article/View/14/5/how-do-i-reset-my-password">How do I reset my password?</a></li>
        <li><a href="https://napshelp.com/index.php?/Knowledgebase/Article/View/15/5/forgot-username">I forgot my username</a></li>
      </ul>
    </div>
  </div>
</body></html>
`

describe('extractFaq', () => {
  const entries = extractFaq(FAQ_HTML)

  it('returns one entry per question link', () => {
    expect(entries).toHaveLength(3)
  })

  it('parses question + category + sourceUrl', () => {
    expect(entries[0]).toMatchObject({
      question: 'How do I contact Naps?',
      category: 'Contact Us',
      sourceUrl: 'https://napshelp.com/index.php?/Knowledgebase/Article/View/95/11/how-do-i-contact-naps',
    })
  })

  it('answer is undefined when the FAQ index only links to NapsHelp', () => {
    expect(entries[0].answer).toBeUndefined()
  })

  it('id is a stable slug derived from the question text', () => {
    expect(entries[0].id).toBe('how-do-i-contact-naps')
    expect(entries[2].id).toBe('i-forgot-my-username')
  })

  it('groups by category — second category appears for both its entries', () => {
    expect(entries[1].category).toBe('My Account')
    expect(entries[2].category).toBe('My Account')
  })
})
