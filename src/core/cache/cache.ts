import { redisManager } from '../config/redis';
import { logger } from '../../shared/utils/logger';

export class CacheService {
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      if (!redisManager.isConnectedToRedis()) return null;
      const raw = await redisManager.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async setJSON(key: string, value: unknown, ttlSec: number): Promise<void> {
    try {
      if (!redisManager.isConnectedToRedis()) return;
      await redisManager.set(key, JSON.stringify(value), ttlSec);
    } catch {
      logger.warn('cache set failed');
    }
  }
}

export const cacheService = new CacheService();
