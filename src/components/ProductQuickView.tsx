'use client'
import { useEffect, useRef, useState } from 'react'
import { Navigation, Pagination } from 'swiper/modules'
import type { SwiperOptions } from 'swiper/types'
import type { Product } from '@/data/types'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSwiper } from '@/hooks/useSwiper'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { parsePrice, packTiers } from '@/lib/pricing'
import { ratingSummary } from '@/lib/reviews'

// Carousel only mounts for multi-image products. Single-image products render a
// plain <img>, so no Swiper instance is created for the 689 single-image SKUs.
const galleryConfig: SwiperOptions = {
  modules: [Navigation, Pagination],
  slidesPerView: 1,
  spaceBetween: 0,
  navigation: { nextEl: '.ngc-quickview__next', prevEl: '.ngc-quickview__prev' },
  pagination: { el: '.ngc-quickview__dots', clickable: true },
}

function QuickViewGallery({ images, name }: { images: string[]; name: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useSwiper(ref, galleryConfig)
  return (
    <div ref={ref} className="swiper ngc-quickview__swiper" suppressHydrationWarning>
      <div className="swiper-wrapper" suppressHydrationWarning>
        {images.map((src, i) => (
          <div className="swiper-slide" key={src}>
            <img className="img-fluid ngc-product-image" src={src} alt={`${name} image ${i + 1}`} />
          </div>
        ))}
      </div>
      <button type="button" className="ngc-quickview__prev" aria-label="Previous image">‹</button>
      <button type="button" className="ngc-quickview__next" aria-label="Next image">›</button>
      <div className="ngc-quickview__dots" />
    </div>
  )
}

function Stars({ value }: { value: number }) {
  const filled = Math.round(value)
  return (
    <span className="ngc-quickview__stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`ngc-quickview__star${n <= filled ? ' is-on' : ''}`}>★</span>
      ))}
    </span>
  )
}

export default function ProductQuickView({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { addItem } = useCart()
  const { money } = useCurrency()
  const [added, setAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset the "Added" affordance whenever the dialog opens a (different) product.
  useEffect(() => {
    setAdded(false)
  }, [product?.slug])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  if (!product) return <Dialog open={false} onOpenChange={onOpenChange} />

  const rating = ratingSummary(product.reviews)
  const tiers = packTiers(parsePrice(product.price))
  const href = `/${product.slug}/`
  const images = product.images.filter(Boolean)

  function handleAdd() {
    if (!product) return
    addItem({
      id: `${product.slug}__1`,
      productName: product.name,
      packCount: 1,
      slug: product.slug,
      price: tiers[0].total,
      qty: 1,
      image: images[0],
      brand: product.brand,
    })
    setAdded(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl ngc-quickview">
        <div className="ngc-quickview__grid">
          <div className="ngc-quickview__media">
            {images.length > 1 ? (
              <QuickViewGallery images={images} name={product.name} />
            ) : images[0] ? (
              <img className="img-fluid ngc-product-image" src={images[0]} alt={product.name} />
            ) : (
              <span className="product-image-photo bg-gray-100" aria-hidden="true" />
            )}
          </div>

          <div className="ngc-quickview__info">
            {product.brand && <div className="ngc-quickview__brand">{product.brand}</div>}
            <DialogTitle className="ngc-quickview__title">{product.name}</DialogTitle>
            <DialogDescription className="ngc-quickview__desc-sr">
              Quick view of {product.name}{product.brand ? ` by ${product.brand}` : ''}
            </DialogDescription>

            {rating.count > 0 && (
              <div className="ngc-quickview__rating">
                <Stars value={rating.average} />
                <span className="ngc-quickview__rating-count">({rating.count} reviews)</span>
              </div>
            )}

            {product.price && (
              <div className="ngc-quickview__price">{money(parsePrice(product.price))}</div>
            )}

            {product.description && (
              <p className="ngc-quickview__excerpt">{product.description}</p>
            )}

            <div className="ngc-quickview__actions">
              <button type="button" className="btn btn-dark ngc-quickview__add" onClick={handleAdd}>
                {added ? 'Added ✓' : 'Add to Cart'}
              </button>
              <a href={href} className="ngc-quickview__details">View full details &rarr;</a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
