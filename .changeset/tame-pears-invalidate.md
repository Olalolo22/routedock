---
"@routedock/routedock": minor
---

Respect `Cache-Control: max-age` / `Expires` response headers for per-entry manifest cache TTL, and expose `RouteDockClient.invalidateManifest(url)` for explicit eviction so provider manifest updates take effect before the default TTL expires.
