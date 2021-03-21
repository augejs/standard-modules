import { IScanNode, LifecycleOnAppDidReadyHook, LifecycleOnAppWillCloseHook, LifecycleOnInitHook, Metadata, ScanHook } from "@augejs/core";
import { SubscribeMessage } from "./SubscribeMessage.decorator";
import IORedis, { Commands, Redis } from "ioredis";

export const ConfigName = 'redis';
export const REDIS_IDENTIFIER = Symbol.for(ConfigName);
export const REDIS_SUBSCRIBER_IDENTIFIER = Symbol.for(ConfigName + 'subscriber');

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
          let redis: Redis | IORedis.Cluster | null = null;

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
          const redis: Redis = scanNode.context.container.get<Redis>(REDIS_IDENTIFIER);
          redis && await redis.connect();

          const config: any = {
            ...scanNode.context.rootScanNode?.getConfig(ConfigName),
            ...scanNode.getConfig(ConfigName),
            ...opts
          }

          const startupNodes:[] = config?.startupNodes;

          let redisSubscriber: Redis | IORedis.Cluster | null;
          const subscribers = SubscribeMessage.getMetadata();
          if (subscribers.length > 0) {
            if (startupNodes && startupNodes.length > 0) {
              redisSubscriber = new IORedis.Cluster(startupNodes, {
                ...config,
                redisOptions: {
                  ...config?.redisOptions,
                  lazyConnect: true,
                }
              });
            } else {
              redisSubscriber = new IORedis({
                ...config,
                lazyConnect: true,
              });
            }

            redisSubscriber && await redisSubscriber.connect();
            scanNode.context.container.bind(REDIS_SUBSCRIBER_IDENTIFIER).toConstantValue(redisSubscriber);
          }
          
          await next();
        }
      ),

      LifecycleOnAppDidReadyHook(async (scanNode: IScanNode, next: Function) => {
        const redisSubscriber: Redis | IORedis.Cluster | null = scanNode.context.container.get<Redis>(REDIS_SUBSCRIBER_IDENTIFIER);
        if (redisSubscriber) {
          const subscribers = SubscribeMessage.getMetadata();

          const channels = [...new Set(subscribers.map(subscriber => subscriber.channel))];
          await redisSubscriber.subscribe(channels);

          redisSubscriber.on('message', async (channel, message) => {
            for (const subscriber of subscribers) {
              const instance: any = subscriber.scanNode.instance;
              if (!instance) continue;
              if (typeof instance[subscriber.propertyKey] !== 'function') continue;
              await instance[subscriber.propertyKey](channel, message);
            }
          })
        }

        await next();
      }),

      LifecycleOnAppWillCloseHook(
        async (scanNode: IScanNode, next: Function) => {
          const redis: Redis = scanNode.context.container.get<Redis>(REDIS_IDENTIFIER);
          redis && await redis.disconnect();

          const redisSubscriber: Redis | IORedis.Cluster | null = scanNode.context.container.get<Redis|IORedis.Cluster>(REDIS_SUBSCRIBER_IDENTIFIER) || null;
          if (redisSubscriber) {
            redisSubscriber.removeAllListeners("message");
            await redisSubscriber.disconnect();
          }

          await next();
        }
      )
    ],target)
  }
}
