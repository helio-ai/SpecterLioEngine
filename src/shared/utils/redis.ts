import Redis from 'ioredis';

const REDIS_CONNECTION_TIMEOUT = 10000; // 10 seconds

const redis = new Redis({
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  connectTimeout: REDIS_CONNECTION_TIMEOUT,
  maxRetriesPerRequest: null,
});

export default redis;
