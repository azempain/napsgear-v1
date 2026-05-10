import HeroSlideProductOfWeek from './HeroSlideProductOfWeek'
import HeroSlideBanner from './HeroSlideBanner'

export default function HeroCarousel() {
  return (
    // suppressHydrationWarning: Swiper.js modifies className and data-* attrs
    // after SSR, causing a React hydration diff. These elements are fully
    // managed by Swiper post-hydration, so the mismatch is safe to ignore.
    <div className="hp-slider swiper" suppressHydrationWarning>
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
