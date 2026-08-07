import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 min default

export function getCachedData<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCachedData<T>(key: string, data: T, ttlSeconds?: number): void {
  if (ttlSeconds !== undefined) {
    cache.set(key, data, ttlSeconds);
  } else {
    cache.set(key, data);
  }
}

export function deleteCachedData(key: string): void {
  cache.del(key);
}

export function flushCache(): void {
  cache.flushAll();
}
