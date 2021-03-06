import { Config, Metadata, ScanHook, ScanNode, LifecycleOnInitHook, LogLevel, LogTransport, Logger, LifecycleOnAppWillCloseHook } from '@augejs/core';
import log4js, { Logger as Log4JsLogger, Configuration } from 'log4js';

export const ConfigName = 'log4js';
export const LOG4JS_IDENTIFIER = Symbol.for(ConfigName);

export function Log4js(opts?: Configuration): ClassDecorator {
  return function(target: NewableFunction) {
    Metadata.decorate([
      Config({
        // https://log4js-node.github.io/log4js-node/file.html
        [ConfigName]: {
          appenders: {
            out: { type: 'stdout' },
          },
          categories: {
            default: { appenders: [ 'out' ], level: 'debug' }
          },
          ...opts,
        }
      }),

      ScanHook(async (scanNode: ScanNode, next: CallableFunction) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: Configuration = {
          ...scanNode.context.rootScanNode!.getConfig(ConfigName),
          ...scanNode.getConfig(ConfigName),
        }

        log4js.configure(config);
        
        const getLogger = log4js.getLogger;
        const log4jsCategories: Record<string, Log4JsLogger> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (log4js as any).getLogger = (category: string): Log4JsLogger => {
          if (log4jsCategories[category]) {
            return log4jsCategories[category];
          }
          const logger: Log4JsLogger = getLogger(category);
          log4jsCategories[category] = logger;
          return logger;
        }

        scanNode.context.container.bind(LOG4JS_IDENTIFIER).toConstantValue(log4js);
        await next();
      }),

      LifecycleOnInitHook(
        async (scanNode: ScanNode, next: CallableFunction) => {
          const log4jsLoggerTransport: LogTransport = {
            printMessage(logItem) {
              const context:string = logItem.context;
              const message: string = logItem.message;
              const loglevel:string = logItem.level;
      
              const log4JsLogger:Log4JsLogger = log4js.getLogger(context);

              switch(loglevel) {
                case LogLevel.VERBOSE:
                  log4JsLogger.trace(message);
                  break;
      
                case LogLevel.DEBUG:
                  log4JsLogger.debug(message);
                  break;
      
                case LogLevel.INFO:
                  log4JsLogger.info(message);
                  break;
                
                case LogLevel.WARN:
                  log4JsLogger.warn(message);
                  break;  
      
                case LogLevel.ERROR:  
                  log4JsLogger.error(message);
                  break; 
                  
                default:
                  log4JsLogger.trace(message);
                  break;  
              }
            }
          }

          Logger.addTransport(log4jsLoggerTransport);

          await next();
        }
      ),

      LifecycleOnAppWillCloseHook(
        async (scanNode: ScanNode, next: CallableFunction) => {
          await new Promise((resolve: CallableFunction, reject: CallableFunction) => {
            log4js.shutdown((err) => {
              if (!err) {
                resolve();
              } else {
                reject(err);
              }
            })
          });

          await next();
        })
      
    ], target);
  }
}
