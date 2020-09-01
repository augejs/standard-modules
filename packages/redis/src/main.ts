import IORedis, { Commands } from 'ioredis';
import { Metadata, LifecycleOnInitHook, IScanNode, ScanHook, Logger } from '@augejs/module-core';
import { EventEmitter } from 'events';

export const REDIS_IDENTIFIER = 'redis';

// https://github.com/luin/ioredis/blob/master/API.md

const logger = Logger.getLogger(REDIS_IDENTIFIER);

export function Redis(opts?: any): ClassDecorator {
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
            redis = new IORedis.Cluster(startupNodes, config);
          } else {
            redis = new IORedis(config);
          }
          scanNode.context.container.bind(REDIS_IDENTIFIER).toConstantValue(redis);

          await next();
        }
      ),

      LifecycleOnInitHook(
        async (scanNode: IScanNode, next: Function) => {
          const redis: EventEmitter = scanNode.context.container.get<EventEmitter>(REDIS_IDENTIFIER);
          await new Promise((resolve:Function, reject: Function) => {
            redis.once('connect', () => {
              resolve();
            });
            redis.once('error', err => {
              reject(err);
            });
          });

          redis.on('error', err => {
            logger.warn(`redis on err: ${err} \n ${err?.stack}`);
          });

          await next();
        }
      )
    ],target)
  }
}
