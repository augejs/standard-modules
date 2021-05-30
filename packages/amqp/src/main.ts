
import { Config, Metadata, ScanHook, ScanNode, LifecycleOnInitHook, Logger, LifecycleOnAppWillCloseHook } from '@augejs/core'
import amqpConnectionManager, { 
  AmqpConnectionManager, 
  AmqpConnectionManagerOptions 
} from 'amqp-connection-manager'

export { 
  ConfirmChannel, 
  Channel, 
  ConsumeMessage, 
  Message, 
  GetMessage, 
  CommonMessageFields, 
  MessageFields, 
  GetMessageFields, 
  ConsumeMessageFields, 
  MessageProperties, 
  MessagePropertyHeaders, 
  XDeath, 
  ServerProperties 
} from 'amqplib';

const ConfigName = 'amqp';

export const AMQP_IDENTIFIER = Symbol.for(ConfigName);

export * from 'amqp-connection-manager';

const logger = Logger.getLogger(ConfigName);

// https://github.com/benbria/node-amqp-connection-manager
export function Amqp(opts?: {
  urls: string[],
  options?: AmqpConnectionManagerOptions
}): ClassDecorator {
  return function(target: NewableFunction) {
    Metadata.decorate([
      Config({
        [ConfigName]: {
          urls: undefined,
          heartbeatIntervalInSeconds: 5, // 5s
        }
      }),

      ScanHook(async (scanNode: ScanNode, next: CallableFunction) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: any = {
          ...scanNode.context.rootScanNode!.getConfig(ConfigName),
          ...scanNode.getConfig(ConfigName),
          ...opts,
        };

        const amqp:AmqpConnectionManager = amqpConnectionManager.connect(config.urls, config);
        scanNode.context.container.bind(AMQP_IDENTIFIER).toConstantValue(amqp);

        await new Promise((resolve: CallableFunction, reject: CallableFunction) => {
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
        async (scanNode: ScanNode, next: CallableFunction) => {
          const amqp:AmqpConnectionManager = scanNode.context.container.get(AMQP_IDENTIFIER);
          amqp.on('disconnect', ({err})=> {
            logger.warn(`amqp disconnect error: ${err.stack})`);
          });

          await next();
        }
      ),

      LifecycleOnAppWillCloseHook(
        async (scanNode: ScanNode, next: CallableFunction) => {
          const amqp:AmqpConnectionManager = scanNode.context.container.get(AMQP_IDENTIFIER);
          await amqp.close();

          await next();
        }
      )
    ], target);
  }
}

