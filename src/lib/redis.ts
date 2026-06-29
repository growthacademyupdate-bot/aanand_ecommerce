import Redis from 'ioredis';

/**
 * Redis Cache Service
 * 
 * This service provides a Redis caching layer with error handling.
 * If Redis is unavailable, the application continues to work by falling back to the database.
 * 
 * Cache Keys:
 * - products:list - All products list
 * - product:{slug} - Individual product by slug
 * - categories:list - Categories with counts
 * - products:featured - Featured products list
 */

let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 * Returns the Redis client instance or null if Redis is not available
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;
  if (!redisUrl) {
    console.warn('[Redis] REDIS_URL not configured, caching disabled');
    isRedisAvailable = false;
    return null;
  }

  try {
    // Create Redis client
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('[Redis] Max retries reached, disabling cache');
          isRedisAvailable = false;
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      enableReadyCheck: true,
    });

    // Handle connection events
    redisClient.on('ready', () => {
      console.log('[Redis] Connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      console.warn('[Redis] Connection closed');
      isRedisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error);
    isRedisAvailable = false;
    return null;
  }
}

/**
 * Get data from cache
 * @param key - Cache key
 * @returns Cached data or null if not found or Redis unavailable
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const cached = await client.get(key);
    if (!cached) {
      return null;
    }
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`[Redis] Error getting cache key "${key}":`, error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 * @param key - Cache key
 * @param value - Data to cache
 * @param ttlSeconds - Time to live in seconds
 * @returns true if successful, false otherwise
 */
export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    await client.setex(key, ttlSeconds, serialized);
    return true;
  } catch (error) {
    console.error(`[Redis] Error setting cache key "${key}":`, error);
    return false;
  }
}

/**
 * Delete data from cache
 * @param key - Cache key to delete
 * @returns true if successful, false otherwise
 */
export async function deleteCache(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`[Redis] Error deleting cache key "${key}":`, error);
    return false;
  }
}

/**
 * Delete multiple cache keys by pattern
 * @param pattern - Redis key pattern (e.g., "products:*")
 * @returns Number of keys deleted
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    await client.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`[Redis] Error deleting cache pattern "${pattern}":`, error);
    return 0;
  }
}

/**
 * Cache wrapper function - implements cache-aside pattern
 * First checks cache, if miss, fetches from database and stores in cache
 * 
 * @param key - Cache key
 * @param ttlSeconds - Time to live in seconds
 * @param fetchFn - Function to fetch data from database
 * @returns Data from cache or database
 */
export async function cacheOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
  isValid?: (data: T) => boolean
): Promise<T> {
  const cached = await getFromCache<T>(key);
  if (cached !== null) {
    if (!isValid || isValid(cached)) {
      console.log(`[Redis] Cache HIT for key: ${key}`);
      return cached;
    }
    console.log(`[Redis] Invalid cache entry for key: ${key}, refetching`);
    await deleteCache(key);
  } else {
    console.log(`[Redis] Cache MISS for key: ${key}`);
  }

  const data = await fetchFn();
  await setCache(key, data, ttlSeconds);
  return data;
}

/**
 * Invalidate product-related cache entries
 * Call this when a product is created, updated, or deleted
 * 
 * @param slug - Product slug (optional, for individual product invalidation)
 */
export async function invalidateProductCache(slug?: string): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    await deleteCachePattern('products:v2:*');
    await deleteCachePattern('products:list*');
    await deleteCache('products:home');
    await deleteCache('products:featured');

    if (slug) {
      await deleteCache(`products:v2:product:${slug}`);
      await deleteCache(`product:${slug}`);
    }

    console.log('[Redis] Product cache invalidated');
  } catch (error) {
    console.error('[Redis] Error invalidating product cache:', error);
  }
}

/**
 * Invalidate category-related cache entries
 * Call this when a category is created, updated, or deleted
 */
export async function invalidateCategoryCache(): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    await deleteCache('categories:v2:list');
    await deleteCache('categories:list');

    await deleteCachePattern('products:v2:*');
    await deleteCachePattern('products:list*');
    await deleteCache('products:home');
    await deleteCache('products:featured');

    console.log('[Redis] Category cache invalidated');
  } catch (error) {
    console.error('[Redis] Error invalidating category cache:', error);
  }
}

/**
 * Check if Redis is available
 */
export function isCacheEnabled(): boolean {
  return isRedisAvailable;
}
