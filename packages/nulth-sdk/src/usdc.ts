/**
 * USDC decimal-to-integer conversion shared by nulth-sdk and @routedock/routedock.
 *
 * 1 USDC = 10^7 stroops on Stellar. This is the single canonical converter;
 * callers in other packages re-export it rather than reimplementing the math.
 */

export const USDC_DECIMALS = 7
const USDC_SCALE = 10n ** BigInt(USDC_DECIMALS)

/**
 * Parse a decimal USDC string (e.g. "1.00", "0.0001") into exact stroops
 * (10^-7 USDC) as a bigint, with no floating-point arithmetic.
 *
 * Float math drifts: summing many small amounts in `number` USDC
 * (e.g. 7000 × 0.0001) yields 0.7000000000000006 instead of 0.7, which silently
 * overruns a spend cap on every boundary crossing. Comparing and accumulating in
 * this integer domain is exact.
 *
 * Throws RangeError on malformed input, negatives, precision finer than
 * {@link USDC_DECIMALS} decimals, or values too large to represent exactly.
 */
export function usdcToStroops(amount: string): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount.trim())
  if (!match) {
    throw new RangeError(`Invalid USDC amount: "${amount}"`)
  }
  const whole = match[1]!
  const frac = match[2] ?? ''
  if (frac.length > USDC_DECIMALS) {
    throw new RangeError(
      `USDC amount "${amount}" exceeds ${USDC_DECIMALS} decimals of precision`,
    )
  }
  const fracUnits = BigInt(frac.padEnd(USDC_DECIMALS, '0'))
  const units = BigInt(whole) * USDC_SCALE + fracUnits
  if (units > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`USDC amount "${amount}" is too large to represent exactly`)
  }
  return units
}
