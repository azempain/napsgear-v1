// Generic loading placeholder. Drop-in block with a CSS shimmer keyframe.
// Server-renderable — no client hooks; the animation lives in globals.css.

import type { CSSProperties } from 'react'

export interface SkeletonProps {
  /** CSS width override; accepts any CSS length. Default: 100% */
  width?: string | number
  /** CSS height override; required for stand-alone (non-absolute) usage. */
  height?: string | number
  /** Border radius. Default: 4px. Pass '50%' for round avatars. */
  radius?: string | number
  /** When true, the skeleton positions itself absolutely to fill its parent.
   *  Use for overlaying an image while it loads. */
  fill?: boolean
  className?: string
  /** Optional aria-label for screen readers; default 'Loading…'. */
  label?: string
}

export default function Skeleton({
  width,
  height,
  radius = 4,
  fill,
  className,
  label = 'Loading…',
}: SkeletonProps) {
  const style: CSSProperties = {
    width: fill ? undefined : (width ?? '100%'),
    height: fill ? undefined : height,
    borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
  }
  return (
    <span
      className={`ngc-skeleton${fill ? ' ngc-skeleton--fill' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      role="status"
      aria-label={label}
      aria-busy="true"
    />
  )
}
