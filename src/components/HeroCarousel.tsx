'use client'
import { useRef } from 'react'
import { Autoplay, Pagination } from 'swiper/modules'
import type { SwiperOptions } from 'swiper/types'
import { useSwiper } from '@/hooks/useSwiper'
import HeroSlideProductOfWeek from './HeroSlideProductOfWeek'
import HeroSlideBanner from './HeroSlideBanner'

// Config transcribed verbatim from the original main.js init for .hp-slider.
const heroConfig: SwiperOptions = {
  modules: [Autoplay, Pagination],
  slidesPerView: 1,
  loop: true,
  speed: 200,
  autoplay: { delay: 5000, pauseOnMouseEnter: true },
  pagination: {
    el: '.swiper-pagination',
    bulletClass: 'sw-pagination-bullet',
    bulletActiveClass: 'active',
    clickable: true,
  },
}

export default function HeroCarousel() {
  const ref = useRef<HTMLDivElement>(null)
  useSwiper(ref, heroConfig)

  return (
    // suppressHydrationWarning: Swiper mutates className/data-* post-mount,
    // creating a hydration diff that's safe to ignore (managed by Swiper).
    <div ref={ref} className="hp-slider swiper" suppressHydrationWarning>
      <div className="swiper-wrapper" suppressHydrationWarning>
        <HeroSlideBanner
          href="#"
          src="/img/banners/homepage/phishing-warning.jpg"
          alt="Beware of Phishing Clones"
        />
        <HeroSlideProductOfWeek />
        <HeroSlideBanner
          href="/ask-an-ifbb-pro/"
          src="/img/banners/homepage/banner-ama.jpg"
          alt="Ask an IFBB Pro"
        />
        <HeroSlideBanner
          href="/categories/top-weight-loss-peptides-c147555"
          src="/img/banners/homepage/top-weight-loss/top-weight-loss.jpg"
          alt="Top Weight Loss Peptides"
        />
      </div>
      <div className="swiper-pagination" suppressHydrationWarning />
    </div>
  )
}
