import { ScanNode } from "@augejs/core";
import { Commands } from "ioredis";
import { REDIS_IDENTIFIER } from './RedisConnection.decorator';

const RedisLockPrefix = 'redisLock';

type RedisLockOptions = {
  key?: string,
  time?: number
}

export function RedisLock(opts?: RedisLockOptions): MethodDecorator {
  return (target:unknown, propertyKey:string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod: CallableFunction = descriptor!.value;
    descriptor.value = async function (...args: unknown[]) {
      const scanNode: ScanNode | null = this['$scanNode'] || null;
      const redis: Commands | null = scanNode?.context.container.get(REDIS_IDENTIFIER) || null;
      const redisLockKey = `${RedisLockPrefix}:${opts?.key ?? propertyKey.toString()}`;

      if (redis) {
        const lockStatus = await redis.get(redisLockKey);
        if (lockStatus) {
          return;
        }
        await redis.set(redisLockKey, 'Lock' ,'PX', opts?.time ?? 10000);
      }

      // eslint-disable-next-line @typescript-eslint/ban-types
      await (originalMethod as Function).apply(this, args);

      if (redis) {
        await redis.del(redisLockKey);
      }
    }
  }
}
