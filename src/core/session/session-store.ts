import { redisManager } from '../config/redis';
import { sessionConfig } from '../config/agent.config';
import { logger } from '../../shared/utils/logger';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface StoredMessage {
  role: ChatRole;
  content: string;
  timestamp: number;
}

export class SessionStore {
  private key(sessionId: string): string {
    return `chat:history:${sessionId}`;
  }

  async getHistory(
    sessionId: string,
    limit: number = sessionConfig.memoryLimit,
  ): Promise<StoredMessage[]> {
    logger.info('SessionStore.getHistory:start');
    try {
      if (!redisManager.isConnectedToRedis()) return [];
      const key = this.key(sessionId);
      const raw = await redisManager.lrange(key, Math.max(-limit, -1000), -1);
      const parsed = raw.map((s) => JSON.parse(s) as StoredMessage);
      logger.info('SessionStore.getHistory:end');
      return parsed;
    } catch {
      return [];
    }
  }

  async append(sessionId: string, message: StoredMessage): Promise<void> {
    logger.info('SessionStore.append:start');
    if (!redisManager.isConnectedToRedis()) return;
    const key = this.key(sessionId);
    await redisManager.rpush(key, JSON.stringify(message));
    await redisManager.lrange(key, 0, -1); // touch to ensure key exists
    // Trim to memory limit
    const max = sessionConfig.memoryLimit;
    await (redisManager as any).getClient().ltrim(key, -max, -1);
    logger.info('SessionStore.append:end');
  }
}

export const sessionStore = new SessionStore();
