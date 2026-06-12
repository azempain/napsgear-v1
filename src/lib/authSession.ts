'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from './auth-client'

export const authSessionQueryKey = ['auth', 'session'] as const

export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof authClient.getSession>>['data']
>

export async function getAuthSession(): Promise<AuthSession | null> {
  const result = await authClient.getSession()
  if (result.error) throw new Error(result.error.message)
  return result.data ?? null
}

export function useAuthSession() {
  return useQuery({
    queryKey: authSessionQueryKey,
    queryFn: getAuthSession,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut()
      if (result.error) throw new Error(result.error.message)
    },
    onSuccess: () => {
      queryClient.setQueryData(authSessionQueryKey, null)
      queryClient.removeQueries({ queryKey: ['orders'] })
    },
  })
}
