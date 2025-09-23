import { RedisTaskService } from './redisTaskService';

class RedisTaskServiceSingleton {
  private static instance: RedisTaskService | null = null;
  private static isInitializing = false;

  static async getInstance(): Promise<RedisTaskService> {
    if (this.instance) {
      return this.instance;
    }

    // 防止并发初始化
    if (this.isInitializing) {
      // 等待初始化完成
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      if (this.instance) {
        return this.instance;
      }
    }

    this.isInitializing = true;

    try {
      const redisUrl = process.env.REDIS_URI || 'redis://localhost:6379';
      this.instance = new RedisTaskService(redisUrl);
      await this.instance.connect();
      console.log('Redis任务服务单例初始化成功');
    } catch (error) {
      console.error('Redis任务服务单例初始化失败:', error);
      this.instance = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }

    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = null;
    }
  }

  static isConnected(): boolean {
    return this.instance !== null;
  }
}

export default RedisTaskServiceSingleton;