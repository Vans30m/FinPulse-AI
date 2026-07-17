import { prisma } from "../prisma.js";

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await prisma.apiCache.findUnique({
      where: { key }
    });
    if (!cached) return null;
    if (new Date() > cached.expiresAt) {
      // Async clean up of expired cache to not block execution
      prisma.apiCache.delete({ where: { key } }).catch(() => {});
      return null;
    }
    return JSON.parse(cached.value) as T;
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

export async function setCachedData<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const valueStr = JSON.stringify(value);
    await prisma.apiCache.upsert({
      where: { key },
      update: {
        value: valueStr,
        expiresAt
      },
      create: {
        key,
        value: valueStr,
        expiresAt
      }
    });
  } catch (error) {
    console.error("Cache write error:", error);
  }
}
