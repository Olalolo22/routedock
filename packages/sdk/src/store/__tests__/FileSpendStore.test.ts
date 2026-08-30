import assert from 'node:assert/strict'
import { describe, it, after, before } from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { FileSpendStore } from '../FileSpendStore.js'
import type { DailySpend } from '../SpendStore.js'

let tmpDir: string

before(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spendstore-test-'))
})

after(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('FileSpendStore', () => {
  it('returns null when no file exists', async () => {
    const filePath = path.join(tmpDir, 'nonexistent.json')
    const store = new FileSpendStore(filePath)
    assert.equal(await store.read(), null)
  })

  it('round-trips a written accumulator', async () => {
    const filePath = path.join(tmpDir, 'roundtrip.json')
    const store = new FileSpendStore(filePath)
    const state: DailySpend = {
      date: '2026-06-26',
      totalMicros: '5000000',
      endpoints: { 'https://api.example.com': '2000000' },
    }
    await store.write(state)
    const read = await store.read()
    assert.deepEqual(read, state)
  })

  it('creates parent directories if they do not exist', async () => {
    const filePath = path.join(tmpDir, 'nested', 'deep', 'spend.json')
    const store = new FileSpendStore(filePath)
    const state: DailySpend = {
      date: '2026-06-26',
      totalMicros: '1000000',
      endpoints: {},
    }
    await store.write(state)
    const read = await store.read()
    assert.deepEqual(read, state)
  })

  it('overwrites an existing file', async () => {
    const filePath = path.join(tmpDir, 'overwrite.json')
    const store = new FileSpendStore(filePath)
    const state1: DailySpend = {
      date: '2026-06-25',
      totalMicros: '100',
      endpoints: { 'https://a.com': '50' },
    }
    const state2: DailySpend = {
      date: '2026-06-26',
      totalMicros: '200',
      endpoints: { 'https://b.com': '150' },
    }
    await store.write(state1)
    await store.write(state2)
    const read = await store.read()
    assert.deepEqual(read, state2)
    assert.notDeepEqual(read, state1)
  })

  it('returns the file path', () => {
    const filePath = path.join(tmpDir, 'accessor.json')
    const store = new FileSpendStore(filePath)
    assert.equal(store.filePath, filePath)
  })

  it('satisfies the SpendStore interface', async () => {
    const filePath = path.join(tmpDir, 'interface.json')
    const store = new FileSpendStore(filePath)
    assert.equal(typeof store.read, 'function')
    assert.equal(typeof store.write, 'function')
  })

  it('returns null for corrupted JSON file', async () => {
    const filePath = path.join(tmpDir, 'corrupt.json')
    await fs.writeFile(filePath, '{ not valid json', 'utf-8')
    const store = new FileSpendStore(filePath)
    // JSON.parse will throw on corrupted data, which is caught → null
    assert.equal(await store.read(), null)
  })

  it('returns null for a directory instead of a file', async () => {
    const dirPath = path.join(tmpDir, 'is-dir')
    await fs.mkdir(dirPath, { recursive: true })
    const store = new FileSpendStore(dirPath)
    // readFile on a directory throws EISDIR, caught → null
    assert.equal(await store.read(), null)
  })
})
