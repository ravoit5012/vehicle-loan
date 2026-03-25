import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: false,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.logger.warn(`Redis error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      this.logger.warn(`Redis GET failed for key: ${key}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      this.logger.warn(`Redis SET failed for key: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch {
      this.logger.warn(`Redis DEL failed for key: ${key}`);
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
