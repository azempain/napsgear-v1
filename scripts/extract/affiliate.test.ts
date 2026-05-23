import { describe, it, expect } from 'vitest'
import { extractAffiliate } from './affiliate'

const HTML = `
<html><body>
  <a class="nav-link" href="https://www.napsgear.org/pap/affiliates/signup.php#SignupForm">Sign up</a>
  <div class="container">
    <div class="row">
      <div class="col-lg-6 offset-lg-6">
        <p>Direct visitors to our anabolic superstore and earn commissions!</p>
        <p>This program is 100% FREE To join.</p>
      </div>
    </div>
    <h1 class="text-center text-uppercase mb-4">WHY JOIN THE NAPSGEAR AFFILIATE PROGRAM?</h1>
    <div class="row">
      <div class="col-lg-6">
        <p>With our NapsGear Commission Program, your referral is truly "yours"!</p>
        <p>Customers are identified using their email and IP address.</p>
      </div>
    </div>
    <h1 class="text-center text-uppercase mb-4">AFFILIATE PROGRAM - FREQUENTLY ASKED QUESTIONS</h1>
    <div class="card">
      <p>Currently we offer bitcoin, litecoin, Western Union and MoneyGram payments.</p>
    </div>
  </div>
</body></html>
`

describe('extractAffiliate', () => {
  const doc = extractAffiliate(HTML)

  it('uses the first h1 as the heading', () => {
    expect(doc.heading).toBe('WHY JOIN THE NAPSGEAR AFFILIATE PROGRAM?')
  })

  it('captures intro paragraphs from before the first h1', () => {
    expect(doc.intro).toContain('Direct visitors to our anabolic superstore')
  })

  it('emits one section per h1 with its following paragraphs', () => {
    expect(doc.sections).toHaveLength(2)
    expect(doc.sections[0].heading).toBe('WHY JOIN THE NAPSGEAR AFFILIATE PROGRAM?')
    expect(doc.sections[0].paras[0]).toContain('referral is truly')
    expect(doc.sections[1].heading).toContain('FREQUENTLY ASKED QUESTIONS')
  })

  it('captures CTA from a "Sign up" link', () => {
    expect(doc.cta).toEqual({
      label: 'Sign up',
      href: 'https://www.napsgear.org/pap/affiliates/signup.php#SignupForm',
    })
  })
})
