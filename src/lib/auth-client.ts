import { createAuthClient } from 'better-auth/react'

export const NEON_AUTH_URL =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL
  ?? 'https://ep-gentle-bonus-ajmv8uou.neonauth.c-3.us-east-2.aws.neon.tech/neondb/auth'

export const authClient = createAuthClient({
  baseURL: NEON_AUTH_URL,
})
