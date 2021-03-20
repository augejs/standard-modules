import { IScanNode } from "@augejs/core";
import { Commands } from "ioredis";
import { REDIS_IDENTIFIER } from '../constant';

const RedisLockPrefix = 'redisLock:';

export function RedisLock(key: string, time?: number): MethodDecorator {
  return (target:Object, propertyKey:string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod: Function = descriptor!.value;
    descriptor!.value = async function (...args: any[]) {
      const scanNode: IScanNode | null = this['$scanNode'] || null;
      const redis: Commands | null = scanNode?.context.container.get(REDIS_IDENTIFIER) || null;
      const redisLockKey: string = RedisLockPrefix + key;

      if (redis) {
        const lockStatus = await redis.get(redisLockKey);
        if (lockStatus) {
          return;
        }
        await redis.set(redisLockKey, 'Lock' ,'PX', time);
      }

      await originalMethod.apply(this, args);

      if (redis) {
        await redis.del(redisLockKey);
      }
    }
  }
}
