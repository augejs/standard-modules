import Application, { Context } from 'koa';
import path from 'path';
import Router from '@koa/router';
import { 
  Config,
  hookUtil, 
  ILogger, 
  IScanContext, 
  IScanNode, 
  Lifecycle__onAppReady__Hook, 
  Logger, 
  Metadata, 
  ScanHook 
} from "@augejs/core";

import { IKoaApplication } from '../interfaces';

import { RequestMapping, RequestMappingMetadata } from './RequestMapping.decorator';
import { Prefix } from './Prefix.decorator';
import { Middleware, MiddlewareMetadata } from './Middleware.decorator';
import { RequestParams } from './RequestParams.decorator';

export const ConfigName = 'webserver';
export const KOA_WEB_SERVER_IDENTIFIER = Symbol.for(ConfigName);

const logger: ILogger = Logger.getLogger(ConfigName);

declare module 'koa' {
  interface Context {
    scanContext: IScanContext
    app: IKoaApplication;
  }
}

type WebServerOptions = {
  host?: string
  port?: number
  proxy?: boolean
  sensitive?: boolean,
  strict?: boolean
}

export function WebServer(opts?: WebServerOptions): ClassDecorator {
  return function(target: NewableFunction) {
    Metadata.decorate([
      Config({
        [ConfigName]: {
          host: '0.0.0.0',
          port: 7001,
          proxy: false,
          sensitive: false,
          strict: false,
          ...opts,
        }
      }),

      ScanHook(async (scanNode: IScanNode, next: CallableFunction) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: any = {
          ...scanNode.context.rootScanNode!.getConfig(ConfigName),
          ...scanNode.getConfig(ConfigName),
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const koa: any = new Application();
        const router: Router = new Router({
          prefix: config.prefix,
          methods: config.methods,
          routerPath: config.routerPath,
          sensitive: config.sensitive,
          strict: config.strict
        });
        koa.router = router;
        scanNode.context.container.bind(KOA_WEB_SERVER_IDENTIFIER).toConstantValue(koa);
        await next();
      }),
      Lifecycle__onAppReady__Hook(
        async (scanNode: IScanNode, next: CallableFunction) => {
          const koa: IKoaApplication = scanNode.context.container.get<IKoaApplication>(KOA_WEB_SERVER_IDENTIFIER);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const config: any = scanNode.getConfig(ConfigName);
          koa.context.scanContext = scanNode.context;

          for (const metadata of RequestMapping.getMetadata()) {
            await buildRouteByRequestMappingMetadata(koa.router, metadata);
          }
        
          await next();

          koa
          .use(koa.router.routes())
          .use(koa.router.allowedMethods());

          const { host, port } = config;
          await new Promise((resolve: CallableFunction) => {
            koa.listen(port, host, () => {
              resolve();
            })
          });
          logger.verbose(`web server start at http://127.0.0.1:${port}`);
        }
      )
    ], target);
  }
}

async function buildRouteByRequestMappingMetadata(router: Router, metadata: RequestMappingMetadata) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance: any = metadata.scanNode.instance;
  if (!instance) return;

  const instanceMethod: CallableFunction | null = instance[metadata.propertyKey] || null;
  if (!instanceMethod) return;

  const prefixPaths: string[] = [];
  const prefixMiddlewareList: CallableFunction[] = [];

  await hookUtil.traceTreeNodeHook(
    metadata.scanNode, 
    (scanNode) => {
      const prefix:string = Prefix.getMetadata(scanNode.provider);
      if (prefix.length > 0) {
        prefixPaths.push(prefix)
      }
      Middleware.getMetadata(scanNode.provider).forEach((middlewareMetadata: MiddlewareMetadata) => {
        if (middlewareMetadata.propertyKey) return;
        prefixMiddlewareList.push(...middlewareMetadata.hooks);
      })
      return null
    }, hookUtil.sequenceHooks
  )(null, hookUtil.noopNext);

  const prefixPath:string = path.join('/', ...prefixPaths.reverse());
  const routePaths:string[] = metadata.paths.map((routePath:string) => {
    return path.join(prefixPath, routePath);
  });

  if (routePaths.length === 0) return;
  const requestMethod:string = metadata.method.toString() || 'get';
  const methodMiddlewareList:CallableFunction[] = [];
  Middleware.getMetadata(metadata.scanNode.provider).forEach((middlewareMetadata: MiddlewareMetadata) => {
    if (!middlewareMetadata.propertyKey) return;
    if (middlewareMetadata.propertyKey !== metadata.propertyKey) return;

    methodMiddlewareList.push(...middlewareMetadata.hooks);
  });

  router[requestMethod](
    routePaths,
    ...prefixMiddlewareList.reverse(), 
    ...methodMiddlewareList,
    async (context: Context)=> {
      // process args
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const methodActualArgs:any[] = [];
      if (instanceMethod.length > 0) {
        for (let idx = 0; idx < instanceMethod.length; idx++) {
          const argsFns:CallableFunction[] = RequestParams.getMetadata(metadata.scanNode.provider, metadata.propertyKey, idx);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let argsResult:any = context;
          for (const argsFn of argsFns) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let currentArgsResult: any = argsFn(argsResult);
            if (currentArgsResult === undefined) continue;
            if (typeof currentArgsResult?.then === 'function') {
              currentArgsResult = await currentArgsResult;
            }
            argsResult = currentArgsResult;
          }
          methodActualArgs.push(argsResult);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result:any = await (instance[metadata.propertyKey] as CallableFunction)(...methodActualArgs);
      if (result !== undefined) {
        context.body = result;
      }
    }
  )
  
  logger.verbose(`Route bind ${routePaths.join('/')} to ${metadata.scanNode.name}:${metadata.propertyKey.toString()}`);
}
