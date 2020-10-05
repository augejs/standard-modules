import { Metadata } from '@augejs/module-core';
import { IKoaContext } from '../interfaces';

export function RequestParams(processor: (input: any) => any | void | Promise<any | void>):ParameterDecorator {
  return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
    RequestParams.defineMetadata(target.constructor, processor, propertyKey, parameterIndex);
  }
}

RequestParams.defineMetadata = (target: Object, reducer: Function, propertyKey: string | symbol, parameterIndex: number) => {
  Metadata.defineInsertEndArrayMetadata(propertyKey, [ reducer ], target, parameterIndex.toString());
}

RequestParams.getMetadata = (target: Object, propertyKey: string | symbol, parameterIndex: number): Function[] => {
  return Metadata.getMetadata(propertyKey, target, parameterIndex.toString()) || [];
}

RequestParams.Context = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context);
}

RequestParams.Request = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.request);
}

RequestParams.Response = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.response);
}

RequestParams.Cookies = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.cookies);
}

RequestParams.Header = (key?: string):ParameterDecorator => {
  return RequestParams((context: IKoaContext) => {
    if (key) {
      return  context.header[key];
    }
    return context.header;
  });
}
RequestParams.Host = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.host);
}

RequestParams.Hostname = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.hostname);
}

RequestParams.Query = (key?: string):ParameterDecorator => {
  return RequestParams((context: IKoaContext) => {
    if (key) {
      return context.query[key];
    } 
    return context.query;
  });
}

RequestParams.Body = (key?: string):ParameterDecorator => {
  return RequestParams((context: IKoaContext) => {
    if (key) {
      return (context.request as any).body?.[key];
    } 
    return (context.request as any).body
  });
}

RequestParams.Method = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.method);
} 

RequestParams.Path = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.path);
} 

RequestParams.Url = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.url);
} 

RequestParams.OriginalUrl = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.originalUrl);
} 

RequestParams.Origin = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.origin);
}

RequestParams.Href = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.href);
}

RequestParams.Fresh = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.fresh);
}

RequestParams.Stale = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.stale);
}

RequestParams.Protocol = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.protocol);
}

RequestParams.Secure = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.secure);
}

RequestParams.IP = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.ip);
}

RequestParams.IPs = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.ip);
}

RequestParams.Subdomains = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.subdomains);
}

RequestParams.ContentType = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.request.type);
}

RequestParams.Charset = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.request.charset);
}

RequestParams.Files = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context['files']);
}

RequestParams.File = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context['file']);
}















