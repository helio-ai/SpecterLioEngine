export interface LogLevel {
  error: 0;
  warn: 1;
  info: 2;
  debug: 3;
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  error?: Error;
}

class Logger {
  private logLevel: keyof LogLevel = (process.env.LOG_LEVEL as keyof LogLevel) || 'info';

  private shouldLog(level: keyof LogLevel): boolean {
    const levels: LogLevel = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.logLevel];
  }

  private getColorCode(level: keyof LogLevel): string {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      info: '\x1b[36m', // Cyan
      debug: '\x1b[35m', // Magenta
    };
    return colors[level] || '\x1b[0m';
  }

  private getResetCode(): string {
    return '\x1b[0m'; // Reset color
  }

  private formatMessage(level: keyof LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const colorCode = this.getColorCode(level);
    const resetCode = this.getResetCode();
    const prefix = `${colorCode}[${timestamp}] [${level.toUpperCase()}]${resetCode}`;

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }

    return `${prefix} ${message}`;
  }

  error(message: string, data?: any, error?: Error): void {
    // Temporarily enabled for app initialization
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
      if (error) {
        console.error('Stack trace:', error.stack);
      }
    }
  }

  warn(message: string, data?: any): void {
    // Temporarily enabled for app initialization
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  info(message: string, data?: any): void {
    // Temporarily enabled for app initialization
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  debug(message: string, data?: any): void {
    // Temporarily enabled for app initialization
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  // Structured logging for API requests
  logRequest(_req: any, _duration?: number): void {
    // Temporarily disabled for detailed flow analysis
    // this.info('API Request', {
    //   method: req.method,
    //   url: req.url,
    //   ip: req.ip,
    //   userAgent: req.get('User-Agent'),
    //   duration: duration ? `${duration}ms` : undefined,
    // });
  }

  // Structured logging for database operations
  logDatabase(_operation: string, _collection: string, _duration?: number): void {
    // Temporarily disabled for detailed flow analysis
    // this.debug('Database Operation', {
    //   operation,
    //   collection,
    //   duration: duration ? `${duration}ms` : undefined,
    // });
  }

  // Structured logging for AI operations
  logAI(_operation: string, _model: string, _duration?: number, _tokens?: number): void {
    // Temporarily disabled for detailed flow analysis
    // this.info('AI Operation', {
    //   operation,
    //   model,
    //   duration: duration ? `${duration}ms` : undefined,
    //   tokens,
    // });
  }
}

export const logger = new Logger();
