'use client'

import { useQuery } from '@tanstack/react-query'
import { listMyOrders } from './orderPersistence'

export function useMyOrders(userId?: string, active = true) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: listMyOrders,
    enabled: Boolean(userId) && active,
  })
}
