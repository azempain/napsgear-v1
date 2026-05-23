import { describe, it, expect } from 'vitest'
import { extractContact } from './contact'

const HTML = `
<html><body>
  <h1 class="page-title">Welcome to NapsGear Support</h1>
  <form method="post" action="https://napshelp.com/index.php?/Base/User/Login" name="LoginForm"></form>
  <form id="searchform" action="https://napshelp.com/index.php?/Base/Search/Index" name="SearchForm"></form>
</body></html>
`

const HTML_WITH_EMAIL = `
<html><body>
  <h1 class="page-title">Contact Us</h1>
  <p>Reach us at <a href="mailto:support@napshelp.com">support@napshelp.com</a></p>
  <form method="post" action="/submit-ticket"></form>
</body></html>
`

describe('extractContact', () => {
  it('captures page heading + first form action when no inline email present', () => {
    const c = extractContact(HTML)
    expect(c.heading).toBe('Welcome to NapsGear Support')
    expect(c.formAction).toBe('https://napshelp.com/index.php?/Base/User/Login')
    expect(c.email).toBeUndefined()
  })

  it('captures email when it is a mailto link', () => {
    const c = extractContact(HTML_WITH_EMAIL)
    expect(c.email).toBe('support@napshelp.com')
    expect(c.heading).toBe('Contact Us')
    expect(c.formAction).toBe('/submit-ticket')
  })

  it('derives portalUrl from form action host when it points to a different domain', () => {
    const c = extractContact(HTML)
    expect(c.portalUrl).toBe('https://napshelp.com')
  })
})
