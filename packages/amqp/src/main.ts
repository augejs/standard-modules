
import { Config, Metadata, ScanHook, IScanNode, LifecycleOnInitHook, Logger, LifecycleOnAppWillCloseHook } from '@augejs/module-core'
import amqpConnectionManager, { AmqpConnectionManager } from 'amqp-connection-manager'

export const AMQP_IDENTIFIER = 'amqp';

const logger = Logger.getLogger(AMQP_IDENTIFIER);

// https://github.com/benbria/node-amqp-connection-manager

export function Amqp(opts?: any): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      Config({
        [AMQP_IDENTIFIER]: {
          urls: undefined,
          heartbeatIntervalInSeconds: 5, // 5s
        }
      }),

      ScanHook(async (scanNode: IScanNode, next: Function) => {
        const config: any = {
          ...scanNode.context.rootScanNode!.getConfig(AMQP_IDENTIFIER),
          ...scanNode.getConfig(AMQP_IDENTIFIER),
          ...opts,
        };

        const amqp:AmqpConnectionManager = amqpConnectionManager.connect(config.urls, config);
        scanNode.context.container.bind(AMQP_IDENTIFIER).toConstantValue(amqp);

        await new Promise((resolve: Function, reject: Function) => {
          amqp.once('connect', ()=> {
            resolve();
          });

          amqp.once('disconnect', ({err})=> {
            logger.error(`amqp disconnect error: ${err.stack})`);
            reject(err);
          })
        });

        await next();
      }),

      LifecycleOnInitHook(
        async (scanNode: IScanNode, next: Function) => {
          const amqp:AmqpConnectionManager = scanNode.context.container.get(AMQP_IDENTIFIER);
          amqp.on('disconnect', ({err})=> {
            logger.warn(`amqp disconnect error: ${err.stack})`);
          });

          await next();
        }
      ),

      LifecycleOnAppWillCloseHook(
        async (scanNode: IScanNode, next: Function) => {
          const amqp:AmqpConnectionManager = scanNode.context.container.get(AMQP_IDENTIFIER);
          await amqp.close();

          await next();
        }
      )
    ], target);
  }
}

