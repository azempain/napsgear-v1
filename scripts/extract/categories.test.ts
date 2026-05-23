import { describe, it, expect } from 'vitest'
import { extractCategory } from './categories'

const CATEGORY_HTML = `
<html><body>
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="/">Home</a></li>
    <li class="breadcrumb-item active" aria-current="page">Oral Steroids</li>
  </ol>
  <h2 class="category-title">Oral Steroids</h2>
  <a href="https://www.napsgear.org/oral-steroids-c23?currency=USD">Self link</a>
  <div class="products-listing">
    <div class="product-item">
      <h3 class="product-item__title"><a href="https://www.napsgear.org/altamofen-nolvadex-20-mg-p7900">A</a></h3>
    </div>
    <div class="product-item">
      <h3 class="product-item__title"><a href="https://www.napsgear.org/anazole-arimidex-p7897">B</a></h3>
    </div>
    <div class="product-item">
      <h3 class="product-item__title"><a href="https://www.napsgear.org/alphabol-methandienone-p7933">C</a></h3>
    </div>
  </div>
</body></html>
`

describe('extractCategory', () => {
  const c = extractCategory(CATEGORY_HTML)

  it('parses the category name from .category-title', () => {
    expect(c.name).toBe('Oral Steroids')
  })

  it('derives slug from the self-referencing -c<id> href', () => {
    expect(c.slug).toBe('oral-steroids-c23')
  })

  it('parses productSlugs from .product-item__title hrefs', () => {
    expect(c.productSlugs).toEqual([
      'altamofen-nolvadex-20-mg-p7900',
      'anazole-arimidex-p7897',
      'alphabol-methandienone-p7933',
    ])
  })

  it('sets url to /categories/<slug>', () => {
    expect(c.url).toBe('/categories/oral-steroids-c23')
  })
})
