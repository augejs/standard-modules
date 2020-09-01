import { Config, Metadata, ScanHook, IScanNode, LifecycleOnInitHook, LogLevel, ILogTransport, ILogItem, Logger, LifecycleOnAppWillCloseHook } from '@augejs/module-core';
import log4js, { Logger as Log4JsLogger } from 'log4js';

export const LOG4JS_IDENTIFIER = 'log4js';

export function Log4js(opts?: any): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      Config({
        // https://log4js-node.github.io/log4js-node/file.html
        [LOG4JS_IDENTIFIER]: {
          appenders: {
            out: { type: 'stdout' },
          },
          categories: {
            default: { appenders: [ 'out' ], level: 'debug' }
          },
          ...opts,
        }
      }),

      ScanHook(async (scanNode: IScanNode, next: Function) => {
        const config: any = {
          ...scanNode.context.rootScanNode!.getConfig(LOG4JS_IDENTIFIER),
          ...scanNode.getConfig(LOG4JS_IDENTIFIER),
        }

        log4js.configure(config);
        
        const getLogger = log4js.getLogger;
        const log4jsCategories: Record<string, Log4JsLogger> = {};
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
        async (scanNode: IScanNode, next: Function) => {
          const log4jsLoggerTransport: ILogTransport = {
            printMessage(logItem:ILogItem) {
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
        async (scanNode: IScanNode, next: Function) => {
          await new Promise((resolve: Function, reject: Function) => {
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
