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
          let redis: Commands | null = null;
          let redisSubscriber: Commands | null = null;

          const messageNotificationMetadataList = SubscribeMessage.getMetadata();

          if (startupNodes && startupNodes.length > 0) {
            redis = new IORedis.Cluster(startupNodes, {
              ...config,
              redisOptions: {
                ...config?.redisOptions,
                lazyConnect: true,
              }
            });

            if (messageNotificationMetadataList.length > 0) {
              redisSubscriber = new IORedis.Cluster(startupNodes, {
                ...config,
                redisOptions: {
                  ...config?.redisOptions,
                  lazyConnect: true,
                }
              });
            }
          } else {
            redis = new IORedis({
              ...config,
              lazyConnect: true,
            });
            scanNode.context.container.bind(REDIS_IDENTIFIER).toConstantValue(redis);

            if (messageNotificationMetadataList.length > 0) {
              redisSubscriber = new IORedis({
                ...config,
                lazyConnect: true,
              });
            }
          }
          scanNode.context.container.bind(REDIS_SUBSCRIBER_IDENTIFIER).toConstantValue(redisSubscriber);

          await next();
        }
      ),

      LifecycleOnInitHook(
        async (scanNode: IScanNode, next: Function) => {
          const redis: Redis = scanNode.context.container.get<Redis>(REDIS_IDENTIFIER);
          redis && await redis.connect();

          const redisSubscriber: Redis = scanNode.context.container.get<Redis>(REDIS_SUBSCRIBER_IDENTIFIER);
          redisSubscriber && await redisSubscriber.connect();
          
          await next();
        }
      ),

      LifecycleOnAppDidReadyHook(async (scanNode: IScanNode, next: Function) => {
        const redisSubscriber: Redis = scanNode.context.container.get<Redis>(REDIS_SUBSCRIBER_IDENTIFIER);
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

          const redisSubscriber: Redis = scanNode.context.container.get<Redis>(REDIS_SUBSCRIBER_IDENTIFIER);
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
