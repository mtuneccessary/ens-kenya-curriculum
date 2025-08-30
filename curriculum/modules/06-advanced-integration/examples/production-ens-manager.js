// Production-Ready ENS Manager
// Enterprise-grade ENS integration with security, monitoring, and optimization

const { ethers } = require('ethers');
const Redis = require('redis');
const winston = require('winston');
const promClient = require('prom-client');

// Configuration management
const config = {
  development: {
    network: 'goerli',
    rpcUrl: process.env.DEV_RPC_URL,
    redisUrl: 'redis://localhost:6379',
    logLevel: 'debug'
  },
  production: {
    network: 'mainnet',
    rpcUrl: process.env.PROD_RPC_URL,
    redisUrl: process.env.REDIS_URL,
    logLevel: 'info'
  }
};

const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

// Logger setup
const logger = winston.createLogger({
  level: currentConfig.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'ens-production.log' })
  ]
});

// Metrics setup
const register = new promClient.Registry();
const ensRequestsTotal = new promClient.Counter({
  name: 'ens_requests_total',
  help: 'Total number of ENS requests',
  labelNames: ['method', 'status'],
  registers: [register]
});

const ensRequestDuration = new promClient.Histogram({
  name: 'ens_request_duration_seconds',
  help: 'Duration of ENS requests in seconds',
  labelNames: ['method'],
  registers: [register]
});

// Rate limiter class
class RateLimiter {
  constructor(redisClient, maxRequests = 100, windowMs = 900000) {
    this.redis = redisClient;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(identifier) {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      await this.redis.zremrangebyscore(key, '-inf', windowStart);
      const requestCount = await this.redis.zcard(key);

      if (requestCount >= this.maxRequests) {
        ensRequestsTotal.inc({ method: 'ratelimit', status: 'exceeded' });
        throw new Error('Rate limit exceeded');
      }

      await this.redis.zadd(key, now, now.toString());
      await this.redis.expire(key, Math.ceil(this.windowMs / 1000));

      return true;
    } catch (error) {
      logger.error('Rate limit check failed', { identifier, error: error.message });
      throw error;
    }
  }
}

// Cache manager class
class CacheManager {
  constructor(redisClient, ttl = 300) {
    this.redis = redisClient;
    this.ttl = ttl;
  }

  async get(key) {
    try {
      const cached = await this.redis.get(`ens:${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache get failed', { key, error: error.message });
      return null;
    }
  }

  async set(key, value) {
    try {
      await this.redis.setex(`ens:${key}`, this.ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set failed', { key, error: error.message });
    }
  }

  async invalidate(pattern) {
    try {
      const keys = await this.redis.keys(`ens:${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info('Cache invalidated', { pattern, keysInvalidated: keys.length });
      }
    } catch (error) {
      logger.error('Cache invalidation failed', { pattern, error: error.message });
    }
  }
}

// Input validation utility
function validateENSName(name) {
  const errors = [];

  if (typeof name !== 'string') {
    errors.push('Name must be a string');
    return { valid: false, errors };
  }

  if (name.length < 3 || name.length > 63) {
    errors.push('Name must be between 3 and 63 characters');
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push('Name can only contain lowercase letters, numbers, and hyphens');
  }

  if (/--/.test(name)) {
    errors.push('Name cannot contain consecutive hyphens');
  }

  if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) {
    errors.push('Name must start and end with alphanumeric character');
  }

  const reserved = ['eth', 'xyz', 'com', 'org', 'net', 'io', 'app'];
  if (reserved.includes(name.toLowerCase())) {
    errors.push('This name is reserved');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Main ENS Manager class
class ProductionENSManager {
  constructor(options = {}) {
    this.config = { ...currentConfig, ...options };
    this.provider = null;
    this.signer = null;
    this.redis = null;
    this.cache = null;
    this.rateLimiter = null;
    this.contracts = {};
  }

  async initialize() {
    try {
      logger.info('Initializing Production ENS Manager', { environment, network: this.config.network });

      // Initialize provider
      this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);

      // Initialize Redis
      this.redis = Redis.createClient({ url: this.config.redisUrl });
      await this.redis.connect();

      // Initialize cache and rate limiter
      this.cache = new CacheManager(this.redis);
      this.rateLimiter = new RateLimiter(this.redis);

      // Initialize contracts
      this.contracts = {
        registry: new ethers.Contract(
          '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
          ['function owner(bytes32 node) view returns (address)'],
          this.provider
        ),
        resolver: new ethers.Contract(
          '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
          [
            'function addr(bytes32 node) view returns (address)',
            'function text(bytes32 node, string key) view returns (string)'
          ],
          this.provider
        )
      };

      // Test connection
      await this.provider.getBlockNumber();
      logger.info('ENS Manager initialized successfully');

    } catch (error) {
      logger.error('ENS Manager initialization failed', { error: error.message });
      throw error;
    }
  }

  // Namehash calculation with caching
  namehash(name) {
    const cacheKey = `namehash:${name}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    let node = ethers.constants.HashZero;
    if (name !== '') {
      const labels = name.split('.').reverse();
      for (const label of labels) {
        node = ethers.utils.keccak256(
          ethers.utils.concat([
            node,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label))
          ])
        );
      }
    }

    this.cache.set(cacheKey, node);
    return node;
  }

  // Resolve ENS name with monitoring and caching
  async resolveENS(name, clientId = 'anonymous') {
    const startTime = Date.now();
    const endTimer = ensRequestDuration.startTimer({ method: 'resolve' });

    try {
      // Rate limiting
      await this.rateLimiter.checkLimit(clientId);

      // Input validation
      const validation = validateENSName(name);
      if (!validation.valid) {
        ensRequestsTotal.inc({ method: 'resolve', status: 'invalid_input' });
        throw new Error(`Invalid ENS name: ${validation.errors.join(', ')}`);
      }

      // Check cache first
      const cacheKey = `resolve:${name}`;
      let address = await this.cache.get(cacheKey);

      if (!address) {
        logger.info('Resolving ENS name (cache miss)', { name, clientId });

        const nameHash = this.namehash(name);
        address = await this.contracts.resolver.addr(nameHash);

        // Cache the result
        await this.cache.set(cacheKey, address);
      } else {
        logger.debug('ENS resolution from cache', { name, clientId });
      }

      ensRequestsTotal.inc({ method: 'resolve', status: 'success' });
      endTimer();

      logger.info('ENS resolution completed', {
        name,
        address,
        duration: Date.now() - startTime,
        clientId
      });

      return address;

    } catch (error) {
      ensRequestsTotal.inc({ method: 'resolve', status: 'error' });
      endTimer();

      logger.error('ENS resolution failed', {
        name,
        error: error.message,
        duration: Date.now() - startTime,
        clientId
      });

      throw error;
    }
  }

  // Get text record with monitoring
  async getTextRecord(name, key, clientId = 'anonymous') {
    const startTime = Date.now();
    const endTimer = ensRequestDuration.startTimer({ method: 'getText' });

    try {
      await this.rateLimiter.checkLimit(clientId);

      const validation = validateENSName(name);
      if (!validation.valid) {
        ensRequestsTotal.inc({ method: 'getText', status: 'invalid_input' });
        throw new Error(`Invalid ENS name: ${validation.errors.join(', ')}`);
      }

      const cacheKey = `text:${name}:${key}`;
      let text = await this.cache.get(cacheKey);

      if (text === null) { // Note: empty string is a valid cache result
        logger.info('Fetching text record (cache miss)', { name, key, clientId });

        const nameHash = this.namehash(name);
        text = await this.contracts.resolver.text(nameHash, key);

        await this.cache.set(cacheKey, text);
      } else {
        logger.debug('Text record from cache', { name, key, clientId });
      }

      ensRequestsTotal.inc({ method: 'getText', status: 'success' });
      endTimer();

      return text;

    } catch (error) {
      ensRequestsTotal.inc({ method: 'getText', status: 'error' });
      endTimer();

      logger.error('Text record fetch failed', {
        name,
        key,
        error: error.message,
        clientId
      });

      throw error;
    }
  }

  // Batch operations for efficiency
  async batchResolve(names, clientId = 'anonymous') {
    const startTime = Date.now();

    try {
      await this.rateLimiter.checkLimit(clientId);

      logger.info('Starting batch resolution', { count: names.length, clientId });

      const results = await Promise.allSettled(
        names.map(async (name) => {
          try {
            return await this.resolveENS(name, clientId);
          } catch (error) {
            return { error: error.message };
          }
        })
      );

      const duration = Date.now() - startTime;
      logger.info('Batch resolution completed', {
        count: names.length,
        duration,
        clientId
      });

      return results.map((result, index) => ({
        name: names[index],
        address: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null,
        success: result.status === 'fulfilled'
      }));

    } catch (error) {
      logger.error('Batch resolution failed', {
        count: names.length,
        error: error.message,
        clientId
      });
      throw error;
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const redisPing = await this.redis.ping();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        network: this.config.network,
        blockNumber,
        redis: redisPing === 'PONG',
        metrics: await register.getMetricsAsJSON()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('Shutting down ENS Manager');

    if (this.redis) {
      await this.redis.disconnect();
    }

    logger.info('ENS Manager shutdown complete');
  }

  // Get metrics endpoint data
  async getMetrics() {
    return register.metrics();
  }
}

// Export for use in applications
module.exports = { ProductionENSManager, validateENSName };

// Usage example
async function main() {
  const ensManager = new ProductionENSManager();
  
  try {
    await ensManager.initialize();
    
    // Single resolution
    const address = await ensManager.resolveENS('vitalik.eth');
    console.log('vitalik.eth resolves to:', address);
    
    // Text record
    const twitter = await ensManager.getTextRecord('vitalik.eth', 'com.twitter');
    console.log('Twitter handle:', twitter);
    
    // Batch resolution
    const batchResults = await ensManager.batchResolve([
      'vitalik.eth',
      'ens.eth',
      'uniswap.eth'
    ]);
    console.log('Batch results:', batchResults);
    
    // Health check
    const health = await ensManager.healthCheck();
    console.log('Health status:', health.status);
    
  } catch (error) {
    console.error('ENS operation failed:', error);
  } finally {
    await ensManager.shutdown();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
