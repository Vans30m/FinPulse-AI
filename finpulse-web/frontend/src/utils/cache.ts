// src/utils/cache.ts

const cacheStore: Record<string, { data: any; timestamp: number }> = {};

// Default TTL of 5 minutes (300,000 ms) to keep the data fresh but allow instant navigation loads
const DEFAULT_TTL = 300_000;

export const pageCache = {
  get(key: string, ttl = DEFAULT_TTL) {
    const cached = cacheStore[key];
    if (!cached) return null;
    if (Date.now() - cached.timestamp > ttl) {
      delete cacheStore[key];
      return null;
    }
    return cached.data;
  },
  set(key: string, data: any) {
    cacheStore[key] = {
      data,
      timestamp: Date.now()
    };
  },
  clear(key: string) {
    delete cacheStore[key];
  },
  clearAll() {
    Object.keys(cacheStore).forEach(key => delete cacheStore[key]);
  }
};
