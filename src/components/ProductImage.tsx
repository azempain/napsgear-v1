'use client'
// Renders a product thumbnail with a shimmer skeleton overlay while the
// network fetches the image. Hides the skeleton on the first load OR error
// event so a broken image doesn't leave a permanent shimmer.
//
// Uses <picture> + <source> to serve a .webp companion to modern browsers
// (≈25-45% smaller than the JPG/PNG) while keeping the original raster as
// the universal fallback. The .webp is emitted by scripts/optimize-images.ts.

import { useState } from 'react'
import Skeleton from './Skeleton'
import { toWebpSource } from '@/lib/imagePath'

export default function ProductImage({
  src,
  alt,
}: {
  src: string
  alt: string
}) {
  const [loaded, setLoaded] = useState(false)
  const webpSrc = toWebpSource(src)
  return (
    <>
      {!loaded && <Skeleton fill aria-label={`Loading ${alt}`} />}
      <picture>
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`ngc-product-img${loaded ? ' is-loaded' : ''}`}
        />
      </picture>
    </>
  )
}
