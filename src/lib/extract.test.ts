import { describe, it, expect } from 'vitest'
import { slugFromUrl, localizeImage } from './extract'

describe('slugFromUrl', () => {
  it('strips origin and keeps the product slug', () => {
    expect(slugFromUrl('https://www.napsgear.org/alphabol-methandienone-p7933'))
      .toBe('alphabol-methandienone-p7933')
  })
  it('keeps only the last segment when category-prefixed', () => {
    expect(slugFromUrl('https://www.napsgear.org/oral-steroids-c23/alphabol-methandienone-p7933'))
      .toBe('alphabol-methandienone-p7933')
  })
  it('drops query and hash', () => {
    expect(slugFromUrl('https://www.napsgear.org/altamofen-nolvadex-20-mg-p7900?x=1#tab'))
      .toBe('altamofen-nolvadex-20-mg-p7900')
  })
})

describe('localizeImage', () => {
  it('rewrites a saved _files relative path', () => {
    expect(localizeImage('./NapsGear  -  ALPHA-PHARMA HEALTHCARE PAGE_files/alpha-pharma-alphabol.jpg'))
      .toBe('/images/products/alpha-pharma-alphabol.jpg')
  })
  it('rewrites an absolute napsgear catalog url to a local path', () => {
    expect(localizeImage('https://www.napsgear.org/images/catalog/23665/alpha-pharma-anazole.jpg'))
      .toBe('/images/products/alpha-pharma-anazole.jpg')
  })
  it('passes through an already-local path', () => {
    expect(localizeImage('/images/products/x.jpg')).toBe('/images/products/x.jpg')
  })
})

import { parseBrandPage } from './extract'

const BRAND_HTML = `
<aside id="filterSidebar">
  <ul class="filter__list" id="ingredient_list">
    <li class="filter__item" data-count="5"><a class="filter__link" data-id="30">
      <span class="filter-name">Anastrozole</span></a></li>
    <li class="filter__item hidden" data-count="5"><a class="filter__link" data-id="21">
      <span class="filter-name">Tamoxifen Citrate</span></a></li>
    <li class="filter__expand"><a class="filter__expand--button">See More</a></li>
  </ul>
</aside>
<h2 class="category-title"> Alpha-Pharma Healthcare </h2>
<div class="products-listing">
  <div class="product-item" data-id="7933">
    <figure class="product-item__info">
      <div class="product-label label-new"><b>NEW!</b></div>
      <div class="product-label label-sale" title="Sale 5+1"><span>5 + 1</span></div>
      <a class="product-item__image" href="https://www.napsgear.org/alphabol-methandienone-p7933">
        <img alt=" Alphabol " src="./X_files/alpha-pharma-alphabol.jpg"></a>
    </figure>
    <div class="product-item__details">
      <div class="product-item__manufacturer"><a>Alpha-Pharma Healthcare</a></div>
      <h3 class="product-item__title">
        <a href="https://www.napsgear.org/oral-steroids-c23/alphabol-methandienone-p7933">Alphabol (Methandienone)</a></h3>
      <div class="product-item__status"><div class="price-box">
        <span class="product-price">$24</span></div></div>
    </div>
  </div>
</div>`

describe('parseBrandPage', () => {
  const r = parseBrandPage(BRAND_HTML)

  it('reads the brand name from category-title', () => {
    expect(r.brand).toBe('Alpha-Pharma Healthcare')
  })
  it('parses one product with localized image + slug + labels', () => {
    expect(r.products).toHaveLength(1)
    const p = r.products[0]
    expect(p.slug).toBe('alphabol-methandienone-p7933')
    expect(p.name).toBe('Alphabol (Methandienone)')
    expect(p.price).toBe('$24')
    expect(p.brand).toBe('Alpha-Pharma Healthcare')
    expect(p.images).toEqual(['/images/products/alpha-pharma-alphabol.jpg'])
    expect(p.labels).toEqual({ new: true, sale: '5 + 1' })
    expect(p.description).toBe('')
  })
  it('parses the ingredient catalog with brand attribution', () => {
    expect(r.ingredients).toEqual([
      { id: 30, name: 'Anastrozole', count: 5, brand: 'Alpha-Pharma Healthcare' },
      { id: 21, name: 'Tamoxifen Citrate', count: 5, brand: 'Alpha-Pharma Healthcare' },
    ])
  })
})

import { parseDetailPage } from './extract'

const DETAIL_HTML = `
<nav class="breadcrumb-nav"><a href="https://www.napsgear.org/altamofen-nolvadex-20-mg-p7900"></a></nav>
<h1 class="product-title">Altamofen (Nolvadex) 20 mg</h1>
<ul class="product-single-specifications">
  <li><span class="label">Manufacturer:</span> Alpha-Pharma Healthcare</li>
  <li><span class="label">Pharmaceutical name:</span> Tamoxifen Citrate </li>
</ul>
<div class="product-multipliers">
  <div class="product-multipliers__content">
    <div class="product-multipliers__item">
      <label class="product-multipliers__item--info">
        <div class="quantity"> 1 pack  (50 tabs (20mg/tab)) </div>
        <div class="price-per-item">$30</div>
        <div class="price-total">$30</div></label></div>
    <div class="product-multipliers__item">
      <label class="product-multipliers__item--info">
        <div class="quantity"> 5 packs  (250 tabs (20mg/tab)) </div>
        <div class="price-per-item">$28.6</div>
        <div class="price-total">$143</div></label></div>
  </div>
</div>
<div id="productTabs">
  <ul class="nav nav-tabs">
    <li><a class="nav-link" id="gearpicsTab">Customer Images: (135)</a></li>
    <li><a class="nav-link" id="questionsTab">Customer Questions &amp; Answers: 14</a></li>
    <li><a class="nav-link nav-link-reviews" id="reviewsTab">Reviews: 26</a></li>
  </ul>
  <div class="tab-content">
    <div class="tab-pane" id="description">
      <div>Altamofen by Alpha-Pharma.</div><div> </div><div>Second paragraph.</div>
    </div>
  </div>
</div>`

describe('parseDetailPage', () => {
  const d = parseDetailPage(DETAIL_HTML)

  it('extracts slug, ingredient, and counts', () => {
    expect(d.slug).toBe('altamofen-nolvadex-20-mg-p7900')
    expect(d.ingredient).toBe('Tamoxifen Citrate')
    expect(d.reviews).toBe(26)
    expect(d.imagesCount).toBe(135)
    expect(d.qaCount).toBe(14)
  })
  it('joins description blocks, dropping nbsp-only ones', () => {
    expect(d.description).toBe('Altamofen by Alpha-Pharma.\nSecond paragraph.')
  })
  it('extracts real pack tiers with quantity labels', () => {
    expect(d.packs).toEqual([
      { packs: 1, label: '50 tabs (20mg/tab)', perItem: 30, total: 30 },
      { packs: 5, label: '250 tabs (20mg/tab)', perItem: 28.6, total: 143 },
    ])
  })
})

import { mergeProducts, mergeIngredients, applyDetails } from './extract'
import type { Product, Ingredient } from '@/data/types'

describe('mergeProducts', () => {
  it('drops existing rows for the same brand (case-insensitive) and appends new', () => {
    const existing: Product[] = [
      { slug: 'old-p1', name: 'Old', description: '', images: [], brand: 'alpha-pharma healthcare' },
      { slug: 'keep-p9', name: 'Keep', description: '', images: [], brand: 'Other Brand' },
    ]
    const fresh: Product[] = [
      { slug: 'new-p2', name: 'New', description: '', images: [], brand: 'Alpha-Pharma Healthcare' },
    ]
    const out = mergeProducts(existing, 'Alpha-Pharma Healthcare', fresh)
    expect(out.map(p => p.slug)).toEqual(['keep-p9', 'new-p2'])
  })
})

describe('mergeIngredients', () => {
  it('replaces the brand rows only', () => {
    const existing: Ingredient[] = [
      { id: 1, name: 'A', count: 1, brand: 'Alpha-Pharma Healthcare' },
      { id: 2, name: 'B', count: 1, brand: 'Other' },
    ]
    const fresh: Ingredient[] = [{ id: 3, name: 'C', count: 2, brand: 'Alpha-Pharma Healthcare' }]
    const out = mergeIngredients(existing, 'Alpha-Pharma Healthcare', fresh)
    expect(out).toEqual([
      { id: 2, name: 'B', count: 1, brand: 'Other' },
      { id: 3, name: 'C', count: 2, brand: 'Alpha-Pharma Healthcare' },
    ])
  })
})

describe('applyDetails', () => {
  it('attaches detail fields onto the matching product by slug', () => {
    const products: Product[] = [
      { slug: 'altamofen-nolvadex-20-mg-p7900', name: 'Alt', description: '', images: [] },
      { slug: 'other-p1', name: 'Other', description: '', images: [] },
    ]
    const out = applyDetails(products, [
      { slug: 'altamofen-nolvadex-20-mg-p7900', description: 'Desc', ingredient: 'Tamoxifen Citrate',
        packs: [{ packs: 1, perItem: 30, total: 30 }], reviews: 26, imagesCount: 135, qaCount: 14 },
    ])
    const p = out.find(x => x.slug === 'altamofen-nolvadex-20-mg-p7900')!
    expect(p.description).toBe('Desc')
    expect(p.ingredient).toBe('Tamoxifen Citrate')
    expect(p.packs).toEqual([{ packs: 1, perItem: 30, total: 30 }])
    expect(p.reviews).toBe(26)
    expect(out.find(x => x.slug === 'other-p1')!.description).toBe('')
  })
})

describe('parseDetailPage slug — regression: category-prefixed breadcrumb', () => {
  // Mirrors real napsgear detail pages where the breadcrumb shows the
  // current page's category FIRST (whose slug may contain '-p' as a
  // substring, e.g. 'pct---post-cycle-therapy-c518'), and the product
  // anchor appears elsewhere on the page.
  const HTML = `
    <nav class="breadcrumb-nav">
      <a href="https://www.napsgear.org/index.php">Home</a>
      <a href="https://www.napsgear.org/pct---post-cycle-therapy-c518">PCT</a>
    </nav>
    <h1 class="product-title">Altamofen (Nolvadex) 20 mg</h1>
    <a href="https://www.napsgear.org/altamofen-nolvadex-20-mg-p7900">Self link</a>
    <ul class="product-single-specifications">
      <li><span class="label">Pharmaceutical name:</span> Tamoxifen Citrate </li>
    </ul>
    <div id="productTabs"><div class="tab-content"><div class="tab-pane" id="description"><div>Hi</div></div></div></div>
  `

  it('skips the category breadcrumb and picks the product href', () => {
    const d = parseDetailPage(HTML)
    expect(d.slug).toBe('altamofen-nolvadex-20-mg-p7900')
    expect(d.ingredient).toBe('Tamoxifen Citrate')
  })
})

import { parseReviews } from './extract'
import type { Review } from '@/data/types'

const REVIEWS_HTML = `
<div class="product-review-list">
  <div class="product-review__item mb-3">
    <div class="product-review__item-content">
      <div class="product-review__item-header">
        <div class="rating me-2">
          <div class="rating-stars" title="5">
            <span class="rating-stars-icon active"><svg></svg></span>
            <span class="rating-stars-icon active"><svg></svg></span>
            <span class="rating-stars-icon active"><svg></svg></span>
            <span class="rating-stars-icon active"><svg></svg></span>
            <span class="rating-stars-icon active"><svg></svg></span>
          </div>
        </div>
        <div class="post-author"><h4>by Blackhorse</h4></div>
        <div class="post-meta">
          <div class="post-date"><time class="entry-date published">Date Added: 5 months ago</time></div>
        </div>
      </div>
      <div class="product-review__item-body">
        Great post cycle treatment. Back up and runnin in no time
      </div>
    </div>
  </div>
  <div class="product-review__item mb-3">
    <div class="product-review__item-content">
      <div class="product-review__item-header">
        <div class="rating me-2">
          <div class="rating-stars">
            <span class="rating-stars-icon active"><svg></svg></span>
            <span class="rating-stars-icon active"><svg></svg></span>
            <span class="rating-stars-icon active"><svg></svg></span>
            <span class="rating-stars-icon"><svg></svg></span>
            <span class="rating-stars-icon"><svg></svg></span>
          </div>
        </div>
        <div class="post-author"><h4>by Mike</h4></div>
        <div class="post-meta">
          <div class="post-date"><time class="entry-date published">Date Added: 1 year ago</time></div>
        </div>
      </div>
      <div class="product-review__item-body">Solid.</div>
    </div>
  </div>
</div>`

describe('parseReviews', () => {
  const r: Review[] = parseReviews(REVIEWS_HTML)
  it('parses every review item', () => {
    expect(r).toHaveLength(2)
  })
  it('reads rating from the rating-stars title', () => {
    expect(r[0].rating).toBe(5)
  })
  it('falls back to counting active star icons when no title', () => {
    expect(r[1].rating).toBe(3)
  })
  it('strips "by " from author and "Date Added: " from date', () => {
    expect(r[0].author).toBe('Blackhorse')
    expect(r[0].date).toBe('5 months ago')
  })
  it('captures the body text trimmed', () => {
    expect(r[0].body).toBe('Great post cycle treatment. Back up and runnin in no time')
    expect(r[1].body).toBe('Solid.')
  })
  it('returns [] when there are no review items', () => {
    expect(parseReviews('<div></div>')).toEqual([])
  })
})
