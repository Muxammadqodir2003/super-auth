import { Global, Module, Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const redisClientProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: async () => {
    const redis = new Redis({
      host: 'localhost',
      port: 6379,
    });
    return redis;
  },
};

@Global()
@Module({
  providers: [redisClientProvider],
  exports: [redisClientProvider, 'REDIS_CLIENT'],
})
export class RedisModule {}
