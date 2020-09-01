import { Metadata } from '@augejs/module-core';
import { Context } from 'koa';

export function RequestParams(reducer: Function):ParameterDecorator {
  return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
    RequestParams.defineMetadata(target.constructor, reducer, propertyKey, parameterIndex);
  }
}

RequestParams.defineMetadata = (target: Object, reducer: Function, propertyKey: string | symbol, parameterIndex: number) => {
  Metadata.defineInsertEndArrayMetadata(propertyKey, [ reducer ], target, parameterIndex.toString());
}

RequestParams.getMetadata = (target: Object, propertyKey: string | symbol, parameterIndex: number): Function[] => {
  return Metadata.getMetadata(propertyKey, target, parameterIndex.toString()) || [];
}

RequestParams.Context = ():ParameterDecorator => {
  return RequestParams((context: Context) => context);
}

RequestParams.Request = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.request);
}

RequestParams.Response = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.response);
}

RequestParams.Cookies = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.cookies);
}

RequestParams.Header = (key?: string):ParameterDecorator => {
  return RequestParams((context: Context) => {
    if (key) {
      return  context.header[key];
    }
    return context.header;
  });
}
RequestParams.Host = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.host);
}

RequestParams.Hostname = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.hostname);
}

RequestParams.Query = (key?: string):ParameterDecorator => {
  return RequestParams((context: Context) => {
    if (key) {
      return context.query[key];
    } 
    return context.query;
  });
}

RequestParams.Method = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.method);
} 

RequestParams.Path = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.path);
} 

RequestParams.Url = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.url);
} 

RequestParams.OriginalUrl = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.originalUrl);
} 

RequestParams.Origin = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.origin);
}

RequestParams.Href = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.href);
}

RequestParams.Fresh = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.fresh);
}

RequestParams.Stale = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.stale);
}

RequestParams.Protocol = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.protocol);
}

RequestParams.Secure = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.secure);
}

RequestParams.IP = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.ip);
}

RequestParams.IPs = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.ip);
}

RequestParams.Subdomains = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.subdomains);
}

RequestParams.ContentType = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.request.type);
}

RequestParams.Charset = ():ParameterDecorator => {
  return RequestParams((context: Context) => context.request.charset);
}

RequestParams.Files = ():ParameterDecorator => {
  return RequestParams((context: Context) => context['files']);
}

RequestParams.File = ():ParameterDecorator => {
  return RequestParams((context: Context) => context['file']);
}















