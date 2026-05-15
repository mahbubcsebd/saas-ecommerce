const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    // If times > 1, stop retrying to prevent log spam
    if (times > 1) return null;
    return 5000; // Wait 5 seconds before the single retry
  },
  reconnectOnError(err) {
    return false; // Don't automatically reconnect on every error
  }
});

redis.on('connect', () => {
  logger.info('🚀 Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('❌ Redis connection error:', error);
});

module.exports = redis;
