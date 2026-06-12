import type { Gearpic } from '@/data/types'

export default function GearpicItem({ item }: { item: Gearpic }) {
  const href = `/community-gearpics/#gear-${item.id}`
  return (
    <div className="widget-gearpics__item" data-id={item.id}>
      <figure>
        <a href={href}>
          <img src={item.thumb} alt={item.title} />
        </a>
      </figure>
      <div className="product-details">
        <div className="product-date">
          <span>{item.date}</span>
        </div>
        <a href={href} title={item.title}>{item.title}</a>
      </div>
    </div>
  )
}
