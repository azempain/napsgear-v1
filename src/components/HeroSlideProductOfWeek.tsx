export default function HeroSlideProductOfWeek() {
  return (
    <div className="swiper-slide fp-week-product-slide" suppressHydrationWarning>
      <a href="/anastrozole/" className="d-block h-100">
        <div className="fp-week-product">
          <div className="fp-week-product__overlay">
            <div className="fp-week-product__left">
              <div className="fp-week-product__ttl1">50% off this week only</div>
              <div className="fp-week-product__ttl2">PRODUCT OF THE WEEK</div>
              <div className="fp-week-product__name">Anastrozole</div>
              <div className="fp-week-product__manufacturer">Anti Estrogens (PCT)</div>
            </div>
            <div className="fp-week-product__right">
              <div className="fp-week-product__img-card">
                <img
                  src="/images/products/anastrozole-1.jpg"
                  alt="Anastrozole"
                  className="fp-week-product__img"
                />
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
