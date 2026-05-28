/**
 * In-memory cache implementation as temporary solution until Redis is enabled.
 * This provides basic caching with TTL (time-to-live) support.
 */

class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with optional TTL in seconds
   */
  set(key, value, ttl = 1800) {
    // Default TTL: 30 minutes (1800 seconds)
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl * 1000),
    });

    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set new timer for auto-expiration
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);

    this.timers.set(key, timer);

    return true;
  }

  /**
   * Get a value from cache
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Delete a value from cache
   */
  delete(key) {
    // Clear timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    return this.cache.delete(key);
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));

    return keysToDelete.length;
  }

  /**
   * Get all keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }
}

// Export singleton instance
export const cache = new InMemoryCache();

/**
 * Cache helper functions for Shopify data
 */
export const shopifyCache = {
  /**
   * Cache key generator for Shopify data
   */
  key: {
    products: (shopDomain) => `shopify:${shopDomain}:products`,
    orders: (shopDomain, days = 90) => `shopify:${shopDomain}:orders:${days}d`,
    customers: (shopDomain) => `shopify:${shopDomain}:customers`,
    analytics: (shopDomain, days = 90) => `shopify:${shopDomain}:analytics:${days}d`,
    storeInfo: (shopDomain) => `shopify:${shopDomain}:store_info`,
  },

  /**
   * Invalidate all cache for a shop
   */
  invalidateShop: (shopDomain) => {
    cache.deletePattern(`shopify:${shopDomain}:`);
  },

  /**
   * Get or fetch with cache
   */
  getOrFetch: async (key, fetchFn, ttl = 1800) => {
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    cache.set(key, data, ttl);
    return data;
  },

  /**
   * Check if a key exists and is not expired
   */
  has: (key) => {
    return cache.has(key);
  },

  /**
   * Set a value in cache
   */
  set: (key, value, ttl = 1800) => {
    return cache.set(key, value, ttl);
  },

  /**
   * Get a value from cache
   */
  get: (key) => {
    return cache.get(key);
  },
};

export default cache;
