import { qaPosts } from '@/data'
import QaPostCard from './QaPostCard'

export default function QaSection() {
  return (
    <section className="qa-firstpage-section firstpage-section mb-4">
      <h2 className="section-title ls-n-10 m-b-4">
        <a href="#">
          <span className="text-danger">Live</span> Q&amp;A Forums with NapsGear Customers
        </a>
      </h2>
      <div className="carousel-wrapper">
        <div className="swiper-container" id="qaHomepage">
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
