interface HeroSlideBannerProps {
  href: string
  src: string
  alt: string
}

export default function HeroSlideBanner({ href, src, alt }: HeroSlideBannerProps) {
  return (
    <div className="swiper-slide" suppressHydrationWarning>
      <a href={href}>
        <img alt={alt} className="w-100" src={src} />
      </a>
    </div>
  )
}
