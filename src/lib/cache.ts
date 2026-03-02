/**
 * Simple in-memory TTL cache utility.
 * Useful for caching API responses that rarely change (categories, profile).
 *
 * Usage:
 *   const cache = new TTLCache<Category[]>(30_000); // 30 second TTL
 *   const cached = cache.get(userId);
 *   if (cached) return cached;
 *   const data = await prisma.category.findMany(...);
 *   cache.set(userId, data);
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Pre-configured caches for common use cases
export const categoriesCache = new TTLCache<unknown[]>(30_000); // 30 seconds
export const profileCache = new TTLCache<unknown>(60_000);      // 60 seconds
