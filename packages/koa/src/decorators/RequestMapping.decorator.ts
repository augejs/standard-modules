import { Metadata, ScanHook, IScanNode } from '@augejs/module-core';

export enum HttpMethodEnum {
  ALL = 0,
  GET,
  POST,
  PUT,
  DELETE,
  PATCH,
  OPTIONS,
  HEAD,
};

export interface IRequestMappingOptions {
  path?: string,
  method?: HttpMethodEnum,
}

export type RequestMappingMetadata = {
  scanNode: IScanNode,
  propertyKey: string | symbol,
  method: HttpMethodEnum,
  paths: string[],
}

export function RequestMapping(options?:IRequestMappingOptions | string): MethodDecorator {
  return (target:Object, propertyKey:string | symbol, descriptor: PropertyDescriptor) => {

    const method:HttpMethodEnum = (typeof options === 'string' ? HttpMethodEnum.GET : options?.method) || HttpMethodEnum.GET;
    const path:string = (typeof options === 'string' ? options : options?.path) || 
    typeof propertyKey === "string" && propertyKey ||
    '';

    const paths:string[] = path.split(",")
    .filter(Boolean)
    .map((item: string) => {
      return item.trim();
    }).filter(Boolean);

    Metadata.decorate([
      ScanHook(async (scanNode: IScanNode, next: Function)=> {
        const metadata: RequestMappingMetadata = {
          scanNode,
          propertyKey,
          method,
          paths,
        }
        RequestMapping.defineMetadata(metadata);
        await next();
      })

    ], target.constructor);

    return descriptor;
  }
};

RequestMapping.defineMetadata = (metadata:RequestMappingMetadata) => {
  Metadata.defineInsertEndArrayMetadata(RequestMapping, [ metadata ], RequestMapping);
}

RequestMapping.getMetadata = ():RequestMappingMetadata[] => {
  return Metadata.getMetadata(RequestMapping, RequestMapping) || [];
}

const createRequestMappingDecorator = (method: HttpMethodEnum) => {
  return (path?:string) => {
    return RequestMapping({
      path,
      method,
    });
  }
};

const Get = createRequestMappingDecorator(HttpMethodEnum.GET);
const Post = createRequestMappingDecorator(HttpMethodEnum.POST);
const Delete = createRequestMappingDecorator(HttpMethodEnum.DELETE);
const Patch = createRequestMappingDecorator(HttpMethodEnum.PATCH);
const Options = createRequestMappingDecorator(HttpMethodEnum.OPTIONS);
const Head = createRequestMappingDecorator(HttpMethodEnum.HEAD);
const All = createRequestMappingDecorator(HttpMethodEnum.ALL);

RequestMapping.Get = Get;
RequestMapping.Post = Post;
RequestMapping.Delete = Delete;
RequestMapping.Patch = Patch;
RequestMapping.Options = Options;
RequestMapping.Head = Head;
RequestMapping.All = All;