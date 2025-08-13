import { App } from './app';
import { logger } from './shared/utils/logger';

const PORT = 8080;

async function startServer(): Promise<void> {
  try {
    const app = new App();

    // Initialize the application
    await app.initialize();

    // Start the server
    const server = app.getApp().listen(PORT, () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: 'development',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(
          `Port ${PORT} is already in use. Please try a different port or kill the process using this port.`,
        );
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      try {
        await app.shutdown();
        server.close(() => {
          logger.info('Server closed successfully');
          process.exit(0);
        });
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
