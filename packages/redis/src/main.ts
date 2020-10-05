import IORedis, { Commands } from 'ioredis';
import { Metadata, LifecycleOnInitHook, IScanNode, ScanHook, Logger, LifecycleOnAppWillCloseHook } from '@augejs/module-core';
import { EventEmitter } from 'events';

export const REDIS_IDENTIFIER = 'redis';

// https://github.com/luin/ioredis/blob/master/API.md

export { Commands };

export function RedisConfig(opts?: any): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([

      ScanHook(
        async (scanNode: IScanNode, next: Function) => {
          const config: any = {
            ...scanNode.context.rootScanNode?.getConfig(REDIS_IDENTIFIER),
            ...scanNode.getConfig(REDIS_IDENTIFIER),
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
