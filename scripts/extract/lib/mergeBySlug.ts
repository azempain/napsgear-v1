// Upsert helper for slug-keyed records. Used by products, categories,
// brands. The accounting (added / updated / unchanged) feeds the driver's
// per-extractor summary line.

export interface MergeResult<T> {
  merged: T[]
  added: number
  updated: number
  unchanged: number
}

export function mergeBySlug<T extends { slug: string }>(
  existing: T[],
  incoming: T[],
): MergeResult<T> {
  const bySlug = new Map<string, T>(existing.map(e => [e.slug, e]))
  let added = 0
  let updated = 0
  let unchanged = existing.length // assume all existing carry forward, decrement on update

  for (const inc of incoming) {
    const prev = bySlug.get(inc.slug)
    if (!prev) {
      bySlug.set(inc.slug, inc)
      added++
      continue
    }
    // Patch: only copy fields that are present (not undefined) on incoming
    const patch: Record<string, unknown> = {}
    for (const k of Object.keys(inc)) {
      const v = (inc as Record<string, unknown>)[k]
      if (v !== undefined) patch[k] = v
    }
    const next = { ...(prev as Record<string, unknown>), ...patch } as T
    // Compare via JSON serialization — good enough for the static-data shapes here
    if (JSON.stringify(prev) === JSON.stringify(next)) {
      // truly unchanged — leave the counter alone
    } else {
      updated++
      unchanged-- // this one was counted as unchanged, but turns out it changed
      bySlug.set(inc.slug, next)
    }
  }

  return {
    merged: Array.from(bySlug.values()),
    added,
    updated,
    unchanged,
  }
}
