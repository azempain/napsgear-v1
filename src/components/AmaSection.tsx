import { videos } from '@/data'
import AmaVideoCard from './AmaVideoCard'
import AmaPremiereCard from './AmaPremiereCard'

export default function AmaSection() {
  return (
    <section className="ama-firstpage-section firstpage-section mb-5">
      <h2 className="section-title ls-n-10 m-b-4">
        <span className="text-danger">Daily</span> Q&amp;A Video Series - Ask an IFBB Pro Anything
      </h2>
      <div className="carousel-wrapper mb-3 pb-4">
        <div className="swiper-container" id="amaHomepage">
          <div className="swiper-wrapper">
            {videos.map(v => (
              <div className="swiper-slide" key={v.url}>
                {v.isPremiere
                  ? <AmaPremiereCard video={v} />
                  : <AmaVideoCard video={v} />
                }
              </div>
            ))}
          </div>
          <div className="swiper-pagination" />
        </div>
      </div>
      <a className="btn btn-outline-primary btn-sm" href="/ask-an-ifbb-pro/">
        SEE MORE VIDEOS &#x2192;
      </a>
    </section>
  )
}
