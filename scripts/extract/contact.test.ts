import { describe, expect, it } from 'vitest'
import { extractContact } from './contact'

const HTML = `
<html><body>
  <h1 class="page-title">Welcome to NapsGear Support</h1>
  <form action="https://napshelp.com/index.php?/Base/User/Login"></form>
  <div class="dialog-block">
    <div class="dialog-block-title">
      <a href="https://napshelp.com/index.php?/Tickets/Submit">Submit a Ticket</a>
    </div>
    <div class="dialog-block-body">Submit a new issue. Please register first.</div>
  </div>
  <div class="dialog-block">
    <div class="dialog-block-title">
      <a href="https://www.napsgear.org/qa.php">Q&amp;A</a>
    </div>
    <div class="dialog-block-body">Questions and answers with customers.</div>
  </div>
</body></html>
`

describe('extractContact', () => {
  const contact = extractContact(HTML)

  it('extracts portal metadata and support actions', () => {
    expect(contact).toMatchObject({
      heading: 'Welcome to NapsGear Support',
      portalUrl: 'https://napshelp.com',
    })
    expect(contact.actions?.[0]).toEqual({
      label: 'Submit a Ticket',
      href: 'https://napshelp.com/index.php?/Tickets/Submit',
      description: 'Submit a new issue. Please register first.',
    })
  })

  it('rewrites the original Q&A action to the local route', () => {
    expect(contact.actions?.[1]?.href).toBe('/qa/')
  })
})
