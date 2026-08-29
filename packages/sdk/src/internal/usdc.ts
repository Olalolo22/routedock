/**
 * USDC conversion — canonical implementation lives in @routedock/nulth-sdk and is
 * re-exported here so SDK consumers (client, provider) share one converter.
 *
 * @routedock/routedock already depends on @routedock/nulth-sdk, so re-exporting
 * (rather than defining a parallel helper) keeps a single source of truth.
 */
import { usdcToStroops, USDC_DECIMALS } from '@routedock/nulth-sdk'
export { usdcToStroops, USDC_DECIMALS }

/**
 * @deprecated Use {@link usdcToStroops} — the same validated bigint converter.
 * Kept as a thin alias so existing call sites keep working during migration.
 */
export const usdcToUnits = usdcToStroops
