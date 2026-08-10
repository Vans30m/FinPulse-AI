// src/utils/aiCache.ts
//
// NOTE: this is an in-memory, single-process cache. If this backend ever
// runs as more than one process (PM2 cluster mode, multiple containers,
// serverless with concurrent instances), each instance keeps its own
// cache and hit rates will silently drop / rankings may differ between
// instances. Migrate to Redis (or similar shared store) if you scale
// horizontally.
/** Default TTL (ms) – 1 day */
export const DEFAULT_AI_CACHE_TTL = Number(process.env.AI_CACHE_TTL_MS) || 24 * 60 * 60 * 1000; // 86400000 ms
/** Simple in‑memory cache */
const aiCache = new Map();
/** Max number of entries kept in the cache before oldest are evicted */
const MAX_CACHE_ENTRIES = 200;
/** Get cached data for a key, or null if missing/expired */
export function getAiCache(key) {
    const entry = aiCache.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        aiCache.delete(key);
        return null;
    }
    return entry.data;
}
/** Store data in cache with optional custom TTL */
export function setAiCache(key, data, ttlMs = DEFAULT_AI_CACHE_TTL) {
    aiCache.set(key, { data, expiresAt: Date.now() + ttlMs });
    // FIX: loop instead of a single eviction, so the cache actually
    // enforces a hard cap even under bursty writes (previously only one
    // entry was evicted per call, letting size creep past the limit).
    while (aiCache.size > MAX_CACHE_ENTRIES) {
        const oldestKey = aiCache.keys().next().value;
        if (!oldestKey)
            break;
        aiCache.delete(oldestKey);
    }
}
/** Clear the entire AI cache – useful for dev */
export function clearAiCache() {
    aiCache.clear();
}
