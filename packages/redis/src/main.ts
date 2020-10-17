import IORedis, { Commands } from 'ioredis';
import { Metadata, LifecycleOnInitHook, IScanNode, ScanHook, Logger, LifecycleOnAppWillCloseHook } from '@augejs/module-core';
import { EventEmitter } from 'events';

export const ConfigName = 'redis';

export const REDIS_IDENTIFIER = Symbol.for('redis');

// https://github.com/luin/ioredis/blob/master/API.md

export { Commands };

export function RedisConnection(opts?: any): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([

      ScanHook(
        async (scanNode: IScanNode, next: Function) => {
          const config: any = {
            ...scanNode.context.rootScanNode?.getConfig(ConfigName),
            ...scanNode.getConfig(ConfigName),
            ...opts
          }
          const startupNodes:[] = config?.startupNodes;
          let redis: Commands;
          if (startupNodes && startupNodes.length > 0) {
            redis = new IORedis.Cluster(startupNodes, {
              ...config,
              redisOptions: {
                ...config?.redisOptions,
                lazyConnect: true,
              }
            });
          } else {
            redis = new IORedis({
              ...config,
              lazyConnect: true,
            });
          }
          scanNode.context.container.bind(REDIS_IDENTIFIER).toConstantValue(redis);

          await next();
        }
      ),

      LifecycleOnInitHook(
        async (scanNode: IScanNode, next: Function) => {
          const redis: any = scanNode.context.container.get<EventEmitter>(REDIS_IDENTIFIER);
          await redis.connect();
          
          await next();
        }
      ),

      LifecycleOnAppWillCloseHook(
        async (scanNode: IScanNode, next: Function) => {
          const redis: any = scanNode.context.container.get<EventEmitter>(REDIS_IDENTIFIER);
          await redis.disconnect();
          await next();
        }
      )
    ],target)
  }
}

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

