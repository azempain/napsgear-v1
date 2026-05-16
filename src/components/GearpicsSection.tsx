'use client'
import { useRef } from 'react'
import { Grid, Navigation, Pagination } from 'swiper/modules'
import type { SwiperOptions } from 'swiper/types'
import { gearpics } from '@/data'
import { useSwiper } from '@/hooks/useSwiper'
import GearpicItem from './GearpicItem'

const gearpicsConfig: SwiperOptions = {
  modules: [Grid, Navigation, Pagination],
  slidesPerView: 2,
  grid: { rows: 2, fill: 'row' },
  spaceBetween: 20,
  loop: false,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    bulletClass: 'sw-pagination-bullet',
    bulletActiveClass: 'active',
    clickable: true,
  },
  breakpoints: {
    640: { slidesPerView: 2, grid: { rows: 3 } },
    768: { slidesPerView: 3, grid: { rows: 3 } },
    1024: { slidesPerView: 4, grid: { rows: 3 } },
  },
}

export default function GearpicsSection() {
  const ref = useRef<HTMLDivElement>(null)
  useSwiper(ref, gearpicsConfig)

  return (
    <div className="gearpics-section firstpage-section widget-gearpics mb-4">
      <h2 className="section-title ls-n-10 m-b-4">
        <a href="#">Customers images</a>
      </h2>
      <div className="carousel-wrapper">
        <div ref={ref} className="swiper" id="gearpicsCarousel">
          <div className="swiper-wrapper">
            {gearpics.map(g => (
              <div className="swiper-slide" key={g.id}>
                <GearpicItem item={g} />
              </div>
            ))}
          </div>
          <div className="swiper-button-prev" />
          <div className="swiper-button-next" />
          <div className="swiper-pagination" />
        </div>
      </div>
    </div>
  )
}
