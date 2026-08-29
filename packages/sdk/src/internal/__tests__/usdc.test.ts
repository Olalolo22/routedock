import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { usdcToStroops, usdcToUnits, USDC_DECIMALS } from '../usdc.js'

describe('usdcToStroops', () => {
  it('converts valid decimal strings to bigint stroops', () => {
    assert.equal(USDC_DECIMALS, 7)
    assert.equal(usdcToStroops('0'), 0n)
    assert.equal(usdcToStroops('1.00'), 10_000_000n)
    assert.equal(usdcToStroops('0.0001'), 1_000n)
    assert.equal(usdcToStroops('0.0000001'), 1n)
    assert.equal(usdcToStroops('  2.5  '), 25_000_000n)
    assert.equal(usdcToStroops('10000'), 100_000_000_000n)
  })

  it('rejects negative amounts, scientific notation, leading zeros, and malformed inputs', () => {
    assert.throws(() => usdcToStroops('-5'), RangeError)
    assert.throws(() => usdcToStroops('-1'), RangeError)
    assert.throws(() => usdcToStroops('-0.5'), RangeError)
    assert.throws(() => usdcToStroops('0012'), RangeError)
    assert.throws(() => usdcToStroops('01'), RangeError)
    assert.throws(() => usdcToStroops('1e-7'), RangeError)
    assert.throws(() => usdcToStroops('1E-7'), RangeError)
    assert.throws(() => usdcToStroops(''), RangeError)
    assert.throws(() => usdcToStroops('   '), RangeError)
    assert.throws(() => usdcToStroops('abc'), RangeError)
    assert.throws(() => usdcToStroops('1.2.3'), RangeError)
    assert.throws(() => usdcToStroops('1.123456789'), RangeError)
    assert.throws(() => usdcToStroops('0.00000001'), RangeError)
  })
})

describe('usdcToUnits', () => {
  it('scales whole and fractional amounts to integer microUSDC', () => {
    assert.equal(usdcToUnits('1.00'), 10_000_000)
    assert.equal(usdcToUnits('0.0001'), 1_000)
    assert.equal(usdcToUnits('0.0000001'), 1)
    assert.equal(usdcToUnits('0'), 0)
    assert.equal(usdcToUnits('  2.5  '), 25_000_000)
  })

  it('accumulates exactly where float addition drifts', () => {
    // 7000 × 0.0001 USDC. In float this is 0.7000000000000006 > 0.7 and would
    // overrun a 0.7 cap; in the integer domain it is exactly 7_000_000.
    let total = 0
    const unit = usdcToUnits('0.0001')
    for (let i = 0; i < 7000; i++) total += unit
    assert.equal(total, usdcToUnits('0.7'))
    assert.equal(total <= usdcToUnits('0.7'), true)
  })

  it('rejects malformed and over-precise amounts', () => {
    assert.throws(() => usdcToUnits('abc'), RangeError)
    assert.throws(() => usdcToUnits('1.2.3'), RangeError)
    assert.throws(() => usdcToUnits('-1'), RangeError)
    assert.throws(() => usdcToUnits('0012'), RangeError)
    assert.throws(() => usdcToUnits('1e-7'), RangeError)
    assert.throws(() => usdcToUnits('0.00000001'), RangeError)
  })
})
