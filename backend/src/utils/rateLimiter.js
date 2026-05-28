/**
 * In-memory rate limiter for API calls and Shopify API requests.
 * This is a temporary solution until Redis is enabled.
 */

class InMemoryRateLimiter {
  constructor() {
    this.requests = new Map(); // key: [timestamp, timestamp, ...]
    this.windows = new Map(); // key: windowEndTimestamp
  }

  /**
   * Check if a request is allowed based on rate limit
   * @param {string} key - Unique identifier (e.g., shop domain, IP address)
   * @param {number} limit - Maximum requests allowed
   * @param {number} window - Time window in seconds
   * @returns {boolean} - True if request is allowed
   */
  isAllowed(key, limit = 10, window = 60) {
    const now = Date.now();
    const windowMs = window * 1000;

    // Get existing requests for this key
    let timestamps = this.requests.get(key) || [];
    
    // Remove requests outside the current window
    timestamps = timestamps.filter(timestamp => timestamp > now - windowMs);

    // Check if limit exceeded
    if (timestamps.length >= limit) {
      return false;
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(key, timestamps);

    // Set cleanup timer for end of window
    if (!this.windows.has(key)) {
      const timer = setTimeout(() => {
        this.requests.delete(key);
        this.windows.delete(key);
      }, windowMs);
      this.windows.set(key, timer);
    }

    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key, limit = 10, window = 60) {
    const now = Date.now();
    const windowMs = window * 1000;
    const timestamps = this.requests.get(key) || [];
    
    const validTimestamps = timestamps.filter(timestamp => timestamp > now - windowMs);
    return Math.max(0, limit - validTimestamps.length);
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key, window = 60) {
    const now = Date.now();
    const windowMs = window * 1000;
    const timestamps = this.requests.get(key) || [];
    
    if (timestamps.length === 0) {
      return 0;
    }

    const oldestValidTimestamp = timestamps.find(timestamp => timestamp > now - windowMs);
    if (!oldestValidTimestamp) {
      return 0;
    }

    return oldestValidTimestamp + windowMs;
  }

  /**
   * Clear all rate limits for a key
   */
  clear(key) {
    this.requests.delete(key);
    if (this.windows.has(key)) {
      clearTimeout(this.windows.get(key));
      this.windows.delete(key);
    }
  }

  /**
   * Clear all rate limits
   */
  clearAll() {
    this.requests.clear();
    this.windows.forEach(timer => clearTimeout(timer));
    this.windows.clear();
  }
}

// Export singleton instance
export const rateLimiter = new InMemoryRateLimiter();

/**
 * Shopify API rate limiter
 * Shopify has different rate limits for different endpoints
 */
export const shopifyRateLimiter = {
  /**
   * Check if Shopify API request is allowed
   * Shopify REST API: 40 requests per minute for most endpoints
   */
  isAllowed: (shopDomain, endpointType = 'standard') => {
    const limits = {
      standard: { limit: 40, window: 60 }, // 40 requests per minute
      bulk: { limit: 1, window: 60 }, // 1 bulk operation per minute
      graphql: { limit: 100, window: 60 }, // 100 GraphQL points per minute
    };

    const config = limits[endpointType] || limits.standard;
    return rateLimiter.isAllowed(`shopify:${shopDomain}:${endpointType}`, config.limit, config.window);
  },

  /**
   * Get remaining Shopify API requests
   */
  getRemaining: (shopDomain, endpointType = 'standard') => {
    const limits = {
      standard: { limit: 40, window: 60 },
      bulk: { limit: 1, window: 60 },
      graphql: { limit: 100, window: 60 },
    };

    const config = limits[endpointType] || limits.standard;
    return rateLimiter.getRemaining(`shopify:${shopDomain}:${endpointType}`, config.limit, config.window);
  },
};

/**
 * AI API rate limiter
 * Rate limit AI analysis calls to prevent excessive costs
 */
export const aiRateLimiter = {
  /**
   * Check if AI analysis is allowed for a shop
   * Limit: 1 analysis per 30 minutes per shop
   */
  isAnalysisAllowed: (shopDomain) => {
    return rateLimiter.isAllowed(`ai:analysis:${shopDomain}`, 1, 1800); // 1 request per 30 minutes
  },

  /**
   * Get time until next analysis is allowed
   */
  getNextAnalysisTime: (shopDomain) => {
    return rateLimiter.getResetTime(`ai:analysis:${shopDomain}`, 1800);
  },

  /**
   * Clear analysis rate limit for a shop (for testing)
   */
  clearAnalysisLimit: (shopDomain) => {
    rateLimiter.clear(`ai:analysis:${shopDomain}`);
  },
};

export default rateLimiter;
