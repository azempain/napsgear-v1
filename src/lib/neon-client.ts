'use client'

import { createClient } from '@neondatabase/neon-js'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters'

export const NEON_AUTH_URL =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL
  ?? 'https://ep-gentle-bonus-ajmv8uou.neonauth.c-3.us-east-2.aws.neon.tech/neondb/auth'

export const NEON_DATA_API_URL =
  process.env.NEXT_PUBLIC_NEON_DATA_API_URL
  ?? 'https://ep-gentle-bonus-ajmv8uou.apirest.c-3.us-east-2.aws.neon.tech/neondb/rest/v1'

export const neonClient = createClient({
  auth: {
    adapter: BetterAuthReactAdapter(),
    url: NEON_AUTH_URL,
  },
  dataApi: {
    url: NEON_DATA_API_URL,
  },
})

export const authClient = neonClient.auth
