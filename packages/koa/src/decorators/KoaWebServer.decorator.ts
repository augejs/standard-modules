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
} from "@augejs/module-core";

import { RequestMapping, HttpMethodEnum, RequestMappingMetadata } from './RequestMapping.decorator';
import { Prefix } from './Prefix.decorator';
import { Middleware, MiddlewareMetadata } from './Middleware.decorator';
import { RequestParams } from './RequestParams.decorator';

export const KOA_WEB_SERVER_IDENTIFIER:string = 'webserver';
const logger: ILogger = Logger.getLogger(KOA_WEB_SERVER_IDENTIFIER);

export const KOA_ROUTER_IDENTIFIER:string = 'router';

declare module 'koa' {
  interface Context {
    scanContext: IScanContext
  }
}

export function KoaWebServer(opts?: any): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      Config({
        [KOA_WEB_SERVER_IDENTIFIER]: {
          host: '127.0.0.1',
          port: 7001,
          proxy: false,
          sensitive: false,
          strict: false,
          ...opts,
        }
      }),

      ScanHook(async (scanNode: IScanNode, next: Function) => {
        const config: any = {
          ...scanNode.context.rootScanNode!.getConfig(KOA_WEB_SERVER_IDENTIFIER),
          ...scanNode.getConfig(KOA_WEB_SERVER_IDENTIFIER),
        }

        scanNode.context.container.bind(KOA_WEB_SERVER_IDENTIFIER).toConstantValue(new Application());
        scanNode.context.container.bind(KOA_ROUTER_IDENTIFIER).toConstantValue(new Router({
          prefix: config.prefix,
          methods: config.methods,
          routerPath: config.routerPath,
          sensitive: config.sensitive,
          strict: config.strict
        }));
        await next();
      }),
      Lifecycle__onAppReady__Hook(
        async (scanNode: IScanNode, next: Function) => {
          const koa: Application = scanNode.context.container.get<Application>(KOA_WEB_SERVER_IDENTIFIER);
          const router: Router = scanNode.context.container.get<Router>(KOA_ROUTER_IDENTIFIER);
          const config: any = scanNode.getConfig(KOA_WEB_SERVER_IDENTIFIER);

          koa.context.scanContext = scanNode.context;

          for (const metadata of RequestMapping.getMetadata()) {
            await buildRouteByRequestMappingMetadata(router, metadata);
          }
        
          await next();

          koa
          .use(router.routes())
          .use(router.allowedMethods());

          const { host, port } = config;
          await new Promise((resolve: Function) => {
            koa.listen(port, host, () => {
              resolve();
            })
          });
          //-
        }
      )
    ], target);
  }
}

function getRequestMethodByHttpMethodEnum(method: HttpMethodEnum) {
  let requestMethod:string = '';
  switch(method) {
    case HttpMethodEnum.GET:
      requestMethod = 'get';
      break;
      case HttpMethodEnum.HEAD:
      requestMethod = 'head';
      break;
      case HttpMethodEnum.OPTIONS:
      requestMethod = 'options';
      break;
      case HttpMethodEnum.PATCH:
      requestMethod = 'patch';
      break;
      case HttpMethodEnum.POST:
        requestMethod = 'post';  
      break;
      case HttpMethodEnum.PUT:
        requestMethod = 'put';
      break;
      case HttpMethodEnum.ALL:
        requestMethod = 'all';
        break;
      default:
        requestMethod = 'get';
        break;
  }
  return requestMethod;
}

async function buildRouteByRequestMappingMetadata(router: Router, metadata: RequestMappingMetadata) {
  const instance: any = metadata.scanNode.instance;
  if (!instance) return;

  const instanceMethod: Function | null = instance[metadata.propertyKey] || null;
  if (!instanceMethod) return;

  const prefixPaths: string[] = [];
  const prefixMiddlewareList: Function[] = [];

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
  )(null);

  const prefixPath:string = path.join('/', ...prefixPaths.reverse());
  const routePaths:string[] = metadata.paths.map((routePath:string) => {
    return path.join(prefixPath, routePath);
  });

  if (routePaths.length === 0) return;
  const requestMethod:string = getRequestMethodByHttpMethodEnum(metadata.method);
  const methodMiddlewareList:Function[] = [];
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
      const methodActualArgs:any[] = [];
      if (instanceMethod.length > 0) {
        for (let idx:number = 0; idx < instanceMethod.length; idx++) {
          const argsFns:Function[] = RequestParams.getMetadata(metadata.scanNode.provider, metadata.propertyKey, idx);
          let argsResult:any = context;
          for (const argsFn of argsFns) {
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

      const result:any = await (instance[metadata.propertyKey] as Function)(...methodActualArgs);
      if (result !== undefined) {
        context.body = result;
      }
    }
  )
  
  logger.verbose(`Route bind ${routePaths.join('/')} to ${metadata.scanNode.name}:${metadata.propertyKey.toString()}`);
}
