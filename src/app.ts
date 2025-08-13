import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { databaseManager, getDatabaseConfig } from './core/config/database';
import { redisManager, getRedisConfig } from './core/config/redis';
import { errorHandler } from './core/errors/error-handler';
import { logger } from './shared/utils/logger';

// Import database models synchronously
import './shared/database/segment/segment.schema';
import './shared/database/segment/segment-membership.schema';
import './shared/database/segment/import-job.schema';
import './shared/database/campaign/campaign';
import './shared/database/whatsapp/whatsapp.schema';
import './shared/database/whatsapp/message.schema';
import './shared/database/widget/widget.schema';
import './shared/database/attribution/attribution.schema';
import './shared/database/auth/user.schema';
import './shared/database/analytics/analytics.schema';
import './shared/database/context/context.schema';
import './shared/database/instagram/instagram.schema';

// Load environment variables
dotenv.config();

export class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      }),
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      }),
    );

    // Body parsing middlewares
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for rate limiting
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // Chat routes
    const chatRoutes = require('./routes/chat.routes').default;
    this.app.use('/api', chatRoutes);

    // Metrics endpoint (basic placeholder)
    this.app.get('/metrics', (_req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          message: 'Route not found',
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing application...');

      // Initialize database
      const dbConfig = getDatabaseConfig();
      await databaseManager.connect(dbConfig);
      logger.info('Database initialized successfully');

      // Initialize Redis (best-effort)
      const redisConfig = getRedisConfig();
      await redisManager.connect(redisConfig);
      logger.info('Redis init attempted');

      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down application...');

      // Disconnect from database
      await databaseManager.disconnect();
      logger.info('Database disconnected successfully');

      // Disconnect from Redis
      await redisManager.disconnect();
      logger.info('Redis disconnected successfully');

      logger.info('Application shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}
