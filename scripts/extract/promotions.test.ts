import { describe, it, expect } from 'vitest'
import { extractPromotions } from './promotions'

const HTML = `
<html><body>
  <main class="main">
    <div class="container">
      <h4 class="mb-2">Earn Store Credit</h4>
      <ul class="list-unstyled">
        <li><a href="https://www.napsgear.org/pap/affiliates/">Affiliate Partner Program</a></li>
        <li><a href="https://www.napsgear.org/discount_coupons-page.html">Reviews for Cash</a></li>
      </ul>
      <h4 class="mb-2">Products on Sale</h4>
      <ul class="list-unstyled">
        <li><a href="https://www.napsgear.org/super_deals.php">Supplier Super Deals</a></li>
      </ul>
      <h4 class="mb-2">Ask Me Anything</h4>
      <div class="pb-3">
        <a href="https://www.napsgear.org/ama.php" title="Ask Me Anything">
          <img src="./All_promotions_files/banner-ama.jpg" />
        </a>
      </div>
    </div>
  </main>
</body></html>
`

describe('extractPromotions', () => {
  const promos = extractPromotions(HTML)

  it('emits one promo per link inside each h4 + list/banner block', () => {
    // 2 in Earn Store Credit + 1 in Products on Sale + 1 in AMA = 4
    expect(promos).toHaveLength(4)
  })

  it('title = anchor text, body = section heading (groups context)', () => {
    expect(promos[0]).toMatchObject({
      title: 'Affiliate Partner Program',
      body: 'Earn Store Credit',
    })
    expect(promos[2]).toMatchObject({
      title: 'Supplier Super Deals',
      body: 'Products on Sale',
    })
  })

  it('cta carries label + href; napsgear.org absolute href stays absolute (renderer handles routing)', () => {
    expect(promos[0].cta?.label).toBe('Affiliate Partner Program')
    expect(promos[0].cta?.href).toBe('https://www.napsgear.org/pap/affiliates/')
  })

  it('id is a stable slug derived from the title', () => {
    expect(promos[0].id).toBe('affiliate-partner-program')
  })

  it('captures banner image src when promo is a <a><img></a> instead of a list item', () => {
    expect(promos[3].title).toBe('Ask Me Anything')
    expect(promos[3].image).toBe('./All_promotions_files/banner-ama.jpg')
  })
})
