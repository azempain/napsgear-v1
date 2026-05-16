'use client'
import { useEffect, useRef, type RefObject } from 'react'
import Swiper from 'swiper'
import type { SwiperOptions } from 'swiper/types'

/**
 * Initialize a vanilla Swiper instance on the given element ref.
 * Destroys cleanly on unmount.
 *
 * Pass the full config inline. To avoid re-creating the Swiper on every
 * render, define the config object outside the component OR memoize it.
 */
export function useSwiper(
  ref: RefObject<HTMLElement | null>,
  config: SwiperOptions,
) {
  const instance = useRef<Swiper | null>(null)

  useEffect(() => {
    if (!ref.current) return
    instance.current = new Swiper(ref.current, config)
    return () => {
      instance.current?.destroy(true, true)
      instance.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, config])

  return instance
}
