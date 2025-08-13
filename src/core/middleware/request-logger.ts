import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/utils/logger';

export interface RequestLogData {
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  duration: number;
  statusCode: number;
  contentLength?: number;
  timestamp: string;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function (body: any) {
    const duration = Date.now() - startTime;
    const logData: RequestLogData = {
      method: req.method,
      url: req.url,
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      duration,
      statusCode: res.statusCode,
      contentLength: body ? body.length : undefined,
      timestamp: new Date().toISOString(),
    };

    // Log based on status code
    if (res.statusCode >= 400) {
      logger.error('API Request Error', logData);
    } else {
      logger.info('API Request', logData);
    }

    return originalSend.call(this, body);
  };

  next();
};
