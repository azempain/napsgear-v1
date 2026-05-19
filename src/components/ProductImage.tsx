'use client'
// Renders a product thumbnail with a shimmer skeleton overlay while the
// network fetches the image. Hides the skeleton on the first load OR error
// event so a broken image doesn't leave a permanent shimmer.

import { useState } from 'react'
import Skeleton from './Skeleton'

export default function ProductImage({
  src,
  alt,
}: {
  src: string
  alt: string
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      {!loaded && <Skeleton fill aria-label={`Loading ${alt}`} />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 180ms ease' }}
      />
    </>
  )
}
