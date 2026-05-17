import type { PackTier } from '@/data/types'

export type Tier = PackTier

const PACK_COUNTS = [1, 5, 10, 15, 20] as const
// Calibrated to the saved Alpha-Pharma page:
// 1pk $30, 5pk $28.59, 10pk $27, 15pk $25.53, 20pk $24.
const PACK_MULTIPLIERS = [1.0, 0.953, 0.9, 0.851, 0.8] as const

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function parsePrice(raw: string | undefined): number {
  if (!raw) return 0
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

export function packTiers(base: number, packs?: PackTier[]): PackTier[] {
  if (packs && packs.length) return packs
  return PACK_COUNTS.map((count, i) => {
    const perItem = round2(base * PACK_MULTIPLIERS[i])
    return { packs: count, perItem, total: round2(perItem * count) }
  })
}

// Deterministic cosmetic count (reviews / images / Q&A) in [8, 140].
// No real per-product data is stored or invented.
export function pseudoCount(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return 8 + (Math.abs(h) % 133)
}
