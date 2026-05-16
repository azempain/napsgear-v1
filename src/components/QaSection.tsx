'use client'
import { useRef } from 'react'
import { Autoplay, Pagination } from 'swiper/modules'
import type { SwiperOptions } from 'swiper/types'
import { qaPosts } from '@/data'
import { useSwiper } from '@/hooks/useSwiper'
import QaPostCard from './QaPostCard'

const qaConfig: SwiperOptions = {
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
    1024: { slidesPerView: 4 },
  },
}

export default function QaSection() {
  const ref = useRef<HTMLDivElement>(null)
  useSwiper(ref, qaConfig)

  return (
    <section className="qa-firstpage-section firstpage-section mb-4">
      <h2 className="section-title ls-n-10 m-b-4">
        <a href="#">
          <span className="text-danger">Live</span> Q&amp;A Forums with NapsGear Customers
        </a>
      </h2>
      <div className="carousel-wrapper">
        <div ref={ref} className="swiper" id="qaCarousel">
          <div className="swiper-wrapper">
            {qaPosts.map(p => (
              <div className="swiper-slide" key={p.id}>
                <QaPostCard post={p} />
              </div>
            ))}
          </div>
          <div className="swiper-pagination" />
        </div>
      </div>
    </section>
  )
}
