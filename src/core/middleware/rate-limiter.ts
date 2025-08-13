import { Request, Response, NextFunction } from 'express';
import { redisManager } from '../config/redis';
import { RateLimitError } from '../errors/app-error';
import { logger } from '../../shared/utils/logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req: Request) => req.ip || 'unknown', // Default to IP-based limiting
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  middleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = this.config.keyGenerator!(req);
      const redisKey = `rate_limit:${key}`;

      // Get current request count
      const currentCount = await redisManager.get(redisKey);
      const count = currentCount ? parseInt(currentCount) : 0;

      if (count >= this.config.maxRequests) {
        logger.warn('Rate limit exceeded', {
          key,
          count,
          maxRequests: this.config.maxRequests,
          windowMs: this.config.windowMs,
        });

        throw new RateLimitError(
          `Rate limit exceeded. Maximum ${
            this.config.maxRequests
          } requests per ${this.config.windowMs / 1000 / 60} minutes.`,
        );
      }

      // Increment counter
      await redisManager.set(
        redisKey,
        (count + 1).toString(),
        Math.ceil(this.config.windowMs / 1000),
      );

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
      res.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, this.config.maxRequests - count - 1).toString(),
      );
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + this.config.windowMs).toISOString());

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        res.status(429).json({
          success: false,
          error: {
            message: error.message,
            code: 'RATE_LIMIT_EXCEEDED',
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        next(error);
      }
    }
  };

  // Factory method for common rate limit configurations
  static createStandardLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
    });
  }

  static createStrictLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    });
  }

  static createLooseLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 1000, // 1000 requests per hour
    });
  }
}
