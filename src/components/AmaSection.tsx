'use client'
import { useRef } from 'react'
import { Autoplay, Pagination } from 'swiper/modules'
import type { SwiperOptions } from 'swiper/types'
import { videos } from '@/data'
import { useSwiper } from '@/hooks/useSwiper'
import AmaVideoCard from './AmaVideoCard'
import AmaPremiereCard from './AmaPremiereCard'

// Config transcribed verbatim from the original main.js init for #amaHomepage.
// The 1024 breakpoint's slidesPerView in the original was a minified scoped
// variable; reference screenshots show 5 cards at desktop, so we use 5.
const amaConfig: SwiperOptions = {
  modules: [Autoplay, Pagination],
  slidesPerView: 4,
  spaceBetween: 10,
  loop: true,
  autoplay: { delay: 2500, disableOnInteraction: false },
  pagination: {
    el: '.swiper-pagination',
    bulletClass: 'sw-pagination-bullet',
    bulletActiveClass: 'active',
    clickable: true,
  },
  breakpoints: {
    0: { slidesPerView: 1 },
    481: { slidesPerView: 2 },
    768: { slidesPerView: 3 },
    1024: { slidesPerView: 5 },
  },
}

export default function AmaSection() {
  const ref = useRef<HTMLDivElement>(null)
  useSwiper(ref, amaConfig)

  return (
    <section className="ama-firstpage-section firstpage-section mb-5">
      <h2 className="section-title ls-n-10 m-b-4">
        <span className="text-danger">Daily</span> Q&amp;A Video Series - Ask an IFBB Pro Anything
      </h2>
      <div className="carousel-wrapper mb-3 pb-4">
        <div ref={ref} className="swiper" id="amaCarousel">
          <div className="swiper-wrapper">
            {videos.map((v, i) => (
              <div className="swiper-slide" key={v.thumbnail || i}>
                {v.isPremiere
                  ? <AmaPremiereCard video={v} />
                  : <AmaVideoCard video={v} />
                }
              </div>
            ))}
          </div>
          {/* Pagination inside .swiper, like the hero. The swiper's
              padding-bottom (globals.css) reserves space inside the
              overflow:hidden box for Swiper's absolute bottom:8px bullets,
              so they sit cleanly below the slides without overlap. */}
          <div className="swiper-pagination" />
        </div>
      </div>
      <a className="btn btn-outline-primary btn-sm" href="/ask-an-ifbb-pro/">
        SEE MORE VIDEOS &#x2192;
      </a>
    </section>
  )
}
