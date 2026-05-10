import HeroSlideProductOfWeek from './HeroSlideProductOfWeek'
import HeroSlideBanner from './HeroSlideBanner'

export default function HeroCarousel() {
  return (
    <div className="hp-slider swiper">
      <div className="swiper-wrapper">
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
      <div className="swiper-pagination" />
    </div>
  )
}
