// Skeleton tree shown on /cart/ and /checkout/ before CartContext finishes
// reading localStorage. Mirrors the eventual layout closely enough that there's
// no visual jump on hydrate.

import Skeleton from './Skeleton'

const SKEL_ROW = (i: number) => (
  <div key={i} className="ngc-page-skel__row">
    <Skeleton width={64} height={64} radius={6} />
    <div>
      <Skeleton width="60%" height={16} />
      <div style={{ height: 6 }} />
      <Skeleton width="35%" height={12} />
    </div>
    <Skeleton width={64} height={20} />
  </div>
)

export default function CartSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="ngc-page-skel" role="status" aria-label="Loading your cart">
      <div className="ngc-page-skel__list">
        {Array.from({ length: rows }, (_, i) => SKEL_ROW(i))}
      </div>
      <div className="ngc-page-skel__totals" aria-hidden="true">
        <Skeleton width="60%" height={18} />
        <Skeleton width="40%" height={14} />
        <Skeleton width="40%" height={14} />
        <Skeleton width="100%" height={42} radius={4} />
      </div>
    </div>
  )
}
