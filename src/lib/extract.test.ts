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
