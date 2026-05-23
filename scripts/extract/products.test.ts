import { describe, it, expect } from 'vitest'
import { extractListingProducts, extractPdp } from './products'

// Fixtures mirror the actual selectors found in saved PDP + brand listing pages.
// PDP uses ul.product-single-specifications, .product-multipliers__item, etc.
// Listing uses .product-item with .product-item__title|manufacturer|image.

const PDP_HTML = `
<html><body>
  <h1 class="product-title">Altamofen (Nolvadex) 20 mg</h1>

  <ul class="product-single-specifications">
    <li><span class="label">Manufacturer:</span> Alpha-Pharma Healthcare</li>
    <li><span class="label">Pharmaceutical name:</span> Tamoxifen Citrate </li>
  </ul>

  <div class="product-single-image">
    <img src="./Altamofen_files/alpha-pharma-altamofen.jpg" alt="Altamofen" />
  </div>

  <div class="tab-pane active" id="description">
    <div>First paragraph.</div>
    <div>&nbsp;</div>
    <div>Second paragraph.</div>
  </div>

  <div class="product-multipliers__content">
    <div class="product-multipliers__item">
      <label class="product-multipliers__item--info">
        <div class="quantity">1 pack  (50 tabs (20mg/tab))</div>
        <div class="price-per-item">$30</div>
        <div class="price-total">$30</div>
      </label>
    </div>
    <div class="product-multipliers__item">
      <label class="product-multipliers__item--info">
        <div class="quantity">5 packs  (250 tabs (20mg/tab))</div>
        <div class="price-per-item">$28.6</div>
        <div class="price-total">$143</div>
      </label>
    </div>
    <div class="product-multipliers__item">
      <label class="product-multipliers__item--info">
        <div class="quantity">20 packs</div>
        <div class="price-per-item">$24</div>
        <div class="price-total">$480</div>
      </label>
    </div>
  </div>

  <div class="product-review-list">
    <div class="product-review__item">
      <div class="product-review__item-content">
        <div class="product-review__item-header">
          <div class="rating"><div class="rating-stars" title="5"></div></div>
          <div class="post-author">by Alpha</div>
        </div>
        <div class="product-review__item-body">Worked great.</div>
      </div>
    </div>
    <div class="product-review__item">
      <div class="product-review__item-content">
        <div class="product-review__item-header">
          <div class="rating"><div class="rating-stars" title="4"></div></div>
          <div class="post-author">by JBro</div>
        </div>
        <div class="product-review__item-body">Solid.</div>
      </div>
    </div>
  </div>

  <link rel="canonical" href="https://www.napsgear.org/altamofen-nolvadex-20-mg-p7900" />
</body></html>
`

const LISTING_HTML = `
<html><body>
  <div class="products-listing">
    <div class="product-item">
      <a class="product-item__image" href="https://www.napsgear.org/altamofen-nolvadex-20-mg-p7900">
        <img src="./brand_files/alpha-pharma-altamofen.jpg" alt="Altamofen" />
      </a>
      <div class="product-item__details">
        <div class="product-item__manufacturer">Alpha-Pharma Healthcare</div>
        <h3 class="product-item__title">
          <a href="https://www.napsgear.org/altamofen-nolvadex-20-mg-p7900">Altamofen (Nolvadex) 20 mg</a>
        </h3>
        <div class="product-item__status">
          <div class="price-box"><span class="product-price">$30</span></div>
        </div>
      </div>
    </div>
    <div class="product-item">
      <a class="product-item__image" href="https://www.napsgear.org/anazole-arimidex-p7897">
        <img src="./brand_files/alpha-pharma-anazole.jpg" alt="Anazole" />
      </a>
      <div class="product-item__details">
        <div class="product-item__manufacturer">Alpha-Pharma Healthcare</div>
        <h3 class="product-item__title">
          <a href="https://www.napsgear.org/anazole-arimidex-p7897">Anazole (Arimidex)</a>
        </h3>
        <div class="product-item__status">
          <div class="price-box"><span class="product-price">$45</span></div>
        </div>
      </div>
    </div>
  </div>
</body></html>
`

describe('extractPdp', () => {
  const p = extractPdp(PDP_HTML)

  it('parses the product name, brand, ingredient', () => {
    expect(p.name).toBe('Altamofen (Nolvadex) 20 mg')
    expect(p.brand).toBe('Alpha-Pharma Healthcare')
    expect(p.ingredient).toBe('Tamoxifen Citrate')
  })
  it('joins description paragraphs (drops nbsp-only ones)', () => {
    expect(p.description).toBe('First paragraph.\n\nSecond paragraph.')
  })
  it('parses the image path as-is (shell rewrites later)', () => {
    expect(p.images).toEqual(['./Altamofen_files/alpha-pharma-altamofen.jpg'])
  })
  it('parses pack tiers including the optional label', () => {
    expect(p.packs).toEqual([
      { packs: 1,  perItem: 30,   total: 30,  label: '50 tabs (20mg/tab)' },
      { packs: 5,  perItem: 28.6, total: 143, label: '250 tabs (20mg/tab)' },
      { packs: 20, perItem: 24,   total: 480 },
    ])
  })
  it('parses reviews — rating from title attr, body, optional author', () => {
    expect(p.reviews).toEqual([
      { rating: 5, author: 'Alpha', date: '', body: 'Worked great.' },
      { rating: 4, author: 'JBro',  date: '', body: 'Solid.' },
    ])
  })
  it('derives slug from canonical url', () => {
    expect(p.slug).toBe('altamofen-nolvadex-20-mg-p7900')
  })
})

describe('extractListingProducts', () => {
  it('returns one Product per .product-item card', () => {
    const rows = extractListingProducts(LISTING_HTML)
    expect(rows).toHaveLength(2)
    expect(rows[0].slug).toBe('altamofen-nolvadex-20-mg-p7900')
    expect(rows[0].name).toBe('Altamofen (Nolvadex) 20 mg')
    expect(rows[0].brand).toBe('Alpha-Pharma Healthcare')
    expect(rows[0].price).toBe('$30')
    expect(rows[0].images).toEqual(['./brand_files/alpha-pharma-altamofen.jpg'])
  })
  it('returns empty array when no .product-item cards present', () => {
    expect(extractListingProducts('<html><body><div></div></body></html>')).toEqual([])
  })
})
