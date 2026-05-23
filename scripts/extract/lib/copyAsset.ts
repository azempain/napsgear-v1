// Idempotent file copy. Skips when destination already matches source by
// size + mtime. Creates intermediate directories.

import { promises as fs } from 'node:fs'
import path from 'node:path'

export interface CopyResult {
  copied: boolean
  destBytes: number
}

export async function copyAsset(srcPath: string, dstPath: string): Promise<CopyResult> {
  const srcStat = await fs.stat(srcPath)
  let dstStat: import('node:fs').Stats | null = null
  try {
    dstStat = await fs.stat(dstPath)
  } catch {
    // not present — fall through to copy
  }

  if (dstStat && dstStat.size === srcStat.size && dstStat.mtimeMs >= srcStat.mtimeMs) {
    return { copied: false, destBytes: dstStat.size }
  }

  await fs.mkdir(path.dirname(dstPath), { recursive: true })
  await fs.copyFile(srcPath, dstPath)
  return { copied: true, destBytes: srcStat.size }
}
