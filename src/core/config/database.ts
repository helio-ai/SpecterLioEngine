import mongoose from 'mongoose';
import { logger } from '../../shared/utils/logger';
import { DatabaseError } from '../errors/app-error';

export interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(config: DatabaseConfig): Promise<void> {
    try {
      if (this.isConnected) {
        logger.warn('Database already connected');
        return;
      }

      logger.info('Connecting to MongoDB...', { uri: config.uri });

      await mongoose.connect(config.uri, {
        ...config.options,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });

      this.isConnected = true;
      logger.info('MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw new DatabaseError(
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Database not connected');
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw new DatabaseError(
        `Database disconnection failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  getConnection(): mongoose.Connection {
    return mongoose.connection;
  }
}

export const databaseManager = DatabaseManager.getInstance();

export const getDatabaseConfig = (): DatabaseConfig => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-chat-agent';

  return {
    uri,
    options: {
      dbName: process.env.DB_NAME || 'ai-chat-agent',
    },
  };
};
