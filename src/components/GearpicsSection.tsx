import { gearpics } from '@/data'
import GearpicItem from './GearpicItem'

export default function GearpicsSection() {
  return (
    <div className="gearpics-section firstpage-section widget-gearpics mb-4">
      <h2 className="section-title ls-n-10 m-b-4">
        <a href="#">Customers images</a>
      </h2>
      <div className="carousel-wrapper">
        <div className="swiper-container" id="gearpicsHomepage">
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
