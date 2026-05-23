import { describe, it, expect, beforeEach } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { copyAsset } from './copyAsset'

let tmp: string

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'copyasset-'))
})

describe('copyAsset', () => {
  it('copies a file when destination does not exist', async () => {
    const src = path.join(tmp, 'a.jpg')
    const dst = path.join(tmp, 'out', 'a.jpg')
    await fs.writeFile(src, 'hello')
    const r = await copyAsset(src, dst)
    expect(r.copied).toBe(true)
    expect(await fs.readFile(dst, 'utf8')).toBe('hello')
  })

  it('is a no-op when destination already matches (skipped by size+mtime)', async () => {
    const src = path.join(tmp, 'a.jpg')
    const dst = path.join(tmp, 'out', 'a.jpg')
    await fs.writeFile(src, 'hello')
    await copyAsset(src, dst)
    const r2 = await copyAsset(src, dst)
    expect(r2.copied).toBe(false)
  })

  it('re-copies when source size changes', async () => {
    const src = path.join(tmp, 'a.jpg')
    const dst = path.join(tmp, 'out', 'a.jpg')
    await fs.writeFile(src, 'hello')
    await copyAsset(src, dst)
    // Bump source mtime + size to ensure the re-copy fires (filesystem may
    // round mtime to the second, so write contents that differ in length too)
    await new Promise(r => setTimeout(r, 20))
    await fs.writeFile(src, 'hello world')
    const r = await copyAsset(src, dst)
    expect(r.copied).toBe(true)
    expect(await fs.readFile(dst, 'utf8')).toBe('hello world')
  })
})
