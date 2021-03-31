import { IScanNode, LifecycleOnAppDidReadyHook, LifecycleOnAppWillCloseHook, LifecycleOnInitHook, Metadata, ScanHook } from "@augejs/core";
import { SubscribeMessage } from "./SubscribeMessage.decorator";
import IORedis, { Redis } from "ioredis";

export const ConfigName = 'redis';
export const REDIS_IDENTIFIER = Symbol.for(ConfigName);
export const REDIS_SUBSCRIBER_IDENTIFIER = Symbol.for(ConfigName + 'subscriber');


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function RedisConnection(opts?: unknown): ClassDecorator {
  return function(target: CallableFunction) {

    Metadata.decorate([

      ScanHook(
        async (scanNode: IScanNode, next: CallableFunction) => {
          const config: Record<string, unknown> = {
            ...scanNode.context.rootScanNode?.getConfig(ConfigName),
            ...scanNode.getConfig(ConfigName),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(opts as any)
          }
          const startupNodes:[] | null = config?.startupNodes as [] ?? null;
          let redis: Redis | IORedis.Cluster | null = null;

          if (startupNodes && startupNodes.length > 0) {
            redis = new IORedis.Cluster(startupNodes, {
              ...config,
              redisOptions: {
                // eslint-disable-next-line @typescript-eslint/ban-types
                ...(config?.redisOptions as object),
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
        async (scanNode: IScanNode, next: CallableFunction) => {
          const redis: Redis = scanNode.context.container.get<Redis>(REDIS_IDENTIFIER);
          await redis.connect();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const config: any = {
            ...scanNode.context.rootScanNode?.getConfig(ConfigName),
            ...scanNode.getConfig(ConfigName),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(opts as any)
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

      LifecycleOnAppDidReadyHook(async (scanNode: IScanNode, next: CallableFunction) => {
        if (!scanNode.context.container.isBound(REDIS_SUBSCRIBER_IDENTIFIER)) {
          await next();
          return;
        }

        const redisSubscriber: Redis | IORedis.Cluster = scanNode.context.container.get<Redis>(REDIS_SUBSCRIBER_IDENTIFIER);

        const subscribers = SubscribeMessage.getMetadata();

        const channels = [...new Set(subscribers.map(subscriber => subscriber.channel))];
        await redisSubscriber.subscribe(channels);

        redisSubscriber.on('message', async (channel, message) => {
          for (const subscriber of subscribers) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const instance: any = subscriber.scanNode.instance;
            if (!instance) continue;
            if (typeof instance[subscriber.propertyKey] !== 'function') continue;
            await instance[subscriber.propertyKey](channel, message);
          }
        })

        await next();
      }),

      LifecycleOnAppWillCloseHook(
        async (scanNode: IScanNode, next: CallableFunction) => {
          const redis: Redis = scanNode.context.container.get<Redis>(REDIS_IDENTIFIER);
          await redis.disconnect();
          
          if (!scanNode.context.container.isBound(REDIS_SUBSCRIBER_IDENTIFIER)) {
            await next();
            return;
          }

          const redisSubscriber: Redis | IORedis.Cluster = scanNode.context.container.get<Redis|IORedis.Cluster>(REDIS_SUBSCRIBER_IDENTIFIER);
          redisSubscriber.removeAllListeners("message");
          await redisSubscriber.disconnect();

          await next();
        }
      )
    ],target)
  }
}
