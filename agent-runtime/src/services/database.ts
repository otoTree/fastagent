import mongoose from 'mongoose';
import { config } from '../config/config';

// 数据库连接状态
export interface DatabaseStatus {
  connected: boolean;
  host: string;
  database: string;
  lastConnected?: Date;
  error?: string;
}

class DatabaseService {
  private static instance: DatabaseService;
  private connectionStatus: DatabaseStatus = {
    connected: false,
    host: '',
    database: ''
  };

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<void> {
    try {
      const mongoUri = config.mongoUri;
      
      if (!mongoUri) {
        throw new Error('MongoDB URI not configured');
      }

      // 配置mongoose连接选项
      const options = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000
      };

      await mongoose.connect(mongoUri, options);

      // 更新连接状态
      this.connectionStatus = {
        connected: true,
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        lastConnected: new Date()
      };

      console.log(`Connected to MongoDB: ${this.connectionStatus.host}/${this.connectionStatus.database}`);

      // 监听连接事件
      mongoose.connection.on('error', (error: Error) => {
        console.error('MongoDB connection error:', error);
        this.connectionStatus.connected = false;
        this.connectionStatus.error = error.message;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.connectionStatus.connected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        this.connectionStatus.connected = true;
        this.connectionStatus.lastConnected = new Date();
        delete this.connectionStatus.error;
      });

    } catch (error) {
      this.connectionStatus.connected = false;
      this.connectionStatus.error = (error as Error).message;
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.connectionStatus.connected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getStatus(): DatabaseStatus {
    return { ...this.connectionStatus };
  }

  isConnected(): boolean {
    return this.connectionStatus.connected && mongoose.connection.readyState === 1;
  }

  async healthCheck(): Promise<{ healthy: boolean; details: DatabaseStatus }> {
    try {
      if (!this.isConnected()) {
        return {
          healthy: false,
          details: this.getStatus()
        };
      }

      // 执行简单的ping操作
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      
      return {
        healthy: true,
        details: this.getStatus()
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          ...this.getStatus(),
          error: (error as Error).message
        }
      };
    }
  }
}

export const databaseService = DatabaseService.getInstance();