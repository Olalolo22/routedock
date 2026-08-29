import { usdcToStroops, USDC_DECIMALS } from '@routedock/nulth-sdk'

export { usdcToStroops, USDC_DECIMALS }

/**
 * Parse a decimal USDC string (e.g. "1.00", "0.0001") into exact integer
 * microUSDC units (10^-7 USDC), with no floating-point arithmetic.
 *
 * Float math drifts: summing many small amounts in `number` USDC
 * (e.g. 7000 × 0.0001) yields 0.7000000000000006 instead of 0.7, which silently
 * overruns a spend cap on every boundary crossing. Comparing and accumulating in
 * this integer domain is exact.
 *
 * Throws on malformed input or precision finer than {@link USDC_DECIMALS} decimals.
 */
export function usdcToUnits(amount: string): number {
  const stroops = usdcToStroops(amount)
  if (stroops > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`USDC amount "${amount}" is too large to represent exactly`)
  }
  return Number(stroops)
}
