import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SupabaseSeenTxStore } from '../SupabaseSeenTxStore.js'
import { RouteDockNetworkError } from '../../errors.js'

function mockSupabase(opts: {
  queryError?: string
  upsertError?: string
  data?: { tx_hash: string | null; headers: Record<string, string> | null } | null
}): SupabaseClient {
  return {
    from(_table: string) {
      return {
        select(_cols: string) {
          return {
            eq(_field: string, _val: string) {
              return {
                maybeSingle() {
                  return Promise.resolve({
                    data: opts.data ?? null,
                    error: opts.queryError ? { message: opts.queryError } : null,
                  })
                },
              }
            },
          }
        },
        upsert(_payload: unknown, _opts: unknown) {
          return Promise.resolve({
            data: null,
            error: opts.upsertError ? { message: opts.upsertError } : null,
          })
        },
      }
    },
  } as unknown as SupabaseClient
}

describe('SupabaseSeenTxStore', () => {
  it('returns undefined when no matching key exists', async () => {
    const store = new SupabaseSeenTxStore(mockSupabase({ data: null }))
    const result = await store.get('nonexistent')
    assert.equal(result, undefined)
  })

  it('returns a SettlementRecord when a matching key exists', async () => {
    const store = new SupabaseSeenTxStore(
      mockSupabase({
        data: {
          tx_hash: 'tx_abc123',
          headers: { 'X-Payment-Response': 'encoded-response' },
        },
      }),
    )
    const result = await store.get('key1')
    assert.deepEqual(result, {
      txHash: 'tx_abc123',
      headers: { 'X-Payment-Response': 'encoded-response' },
    })
  })

  it('returns txHash as null when the row has no tx_hash', async () => {
    const store = new SupabaseSeenTxStore(
      mockSupabase({
        data: { tx_hash: null, headers: null },
      }),
    )
    const result = await store.get('key1')
    assert.deepEqual(result, { txHash: null })
  })

  it('throws RouteDockNetworkError on query failure', async () => {
    const store = new SupabaseSeenTxStore(
      mockSupabase({ queryError: 'relation "settlements" does not exist' }),
    )
    await assert.rejects(() => store.get('key1'), {
      name: 'RouteDockNetworkError',
      message: /SupabaseSeenTxStore\.get failed/,
    })
  })

  it('throws RouteDockNetworkError on upsert failure', async () => {
    const store = new SupabaseSeenTxStore(
      mockSupabase({ upsertError: 'duplicate key value' }),
    )
    await assert.rejects(
      () => store.set('key1', { txHash: 'hash1', headers: { 'x-test': 'val' } }),
      {
        name: 'RouteDockNetworkError',
        message: /SupabaseSeenTxStore\.set failed/,
      },
    )
  })
})
