const redis = require('../config/redis');
const logger = require('./logger');

const cache = {
  /**
   * Get value from cache
   * @param {string} key
   */
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache GET Error [${key}]:`, error);
      return null;
    }
  },

  /**
   * Set value in cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds (default 1 hour)
   */
  async set(key, value, ttl = 3600) {
    try {
      if (value === undefined || value === null) return;
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      logger.error(`Cache SET Error [${key}]:`, error);
    }
  },

  /**
   * Delete specific key
   * @param {string} key
   */
  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Cache DEL Error [${key}]:`, error);
    }
  },

  /**
   * Delete keys by pattern (e.g., "translations:*")
   * @param {string} pattern
   */
  async delByPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache delByPattern Error [${pattern}]:`, error);
    }
  },
};

module.exports = cache;
