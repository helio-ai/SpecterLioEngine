import Redis from 'ioredis';
import { logger } from '../../shared/utils/logger';
import { ExternalServiceError } from '../errors/app-error';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
}

export class RedisManager {
  private static instance: RedisManager;
  private client: Redis | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async connect(config: RedisConfig): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        logger.warn('Redis already connected');
        return;
      }

      logger.info('Connecting to Redis...', {
        host: config.host,
        port: config.port,
      });

      this.client = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db || 0,
        maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
        connectTimeout: config.connectTimeout || 10000,
      });

      // Handle connection events
      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', () => {
        logger.error('Redis connection error:');
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Connect to Redis (ioredis auto-connects; keep for API parity)
      try {
        // some environments require explicit connect()
        await (this.client as any).connect?.();
      } catch {
        logger.warn('Redis connection failed, continuing without Redis:');
        this.isConnected = false;
        return;
      }
    } catch {
      logger.error('Failed to connect to Redis:');
      // Don't throw error, continue without Redis
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Redis not connected');
        return;
      }

      await this.client.disconnect();
      this.isConnected = false;
      this.client = null;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw new ExternalServiceError(
        `Redis disconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new ExternalServiceError('Redis client not initialized');
    }
    return this.client;
  }

  isConnectedToRedis(): boolean {
    return this.isConnected && this.client?.status === 'ready';
  }

  // Helper methods for common operations
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = this.getClient();
    if (ttl) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  async del(key: string): Promise<number> {
    const client = this.getClient();
    return await client.del(key);
  }

  async exists(key: string): Promise<number> {
    const client = this.getClient();
    return await client.exists(key);
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    const client = this.getClient();
    return await client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    const client = this.getClient();
    return await client.rpush(key, ...values);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const client = this.getClient();
    return await client.lrange(key, start, stop);
  }
}

export const redisManager = RedisManager.getInstance();

export const getRedisConfig = (): RedisConfig => {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
  };
};
