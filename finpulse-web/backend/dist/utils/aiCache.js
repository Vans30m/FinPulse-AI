// src/utils/aiCache.ts
/** Default TTL (ms) – 5 minutes */
export const DEFAULT_AI_CACHE_TTL = Number(process.env.AI_CACHE_TTL_MS) || 5 * 60 * 1000;
/** Simple in‑memory cache */
const aiCache = new Map();
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
    // Optional prune to keep size reasonable
    if (aiCache.size > 200) {
        const oldestKey = aiCache.keys().next().value;
        if (oldestKey)
            aiCache.delete(oldestKey);
    }
}
/** Clear the entire AI cache – useful for dev */
export function clearAiCache() {
    aiCache.clear();
}
