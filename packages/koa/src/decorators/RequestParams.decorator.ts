/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Metadata } from '@augejs/core';
import { KoaContext } from '../interfaces';

type RequestParamsProcessorFunction = (input: any, context:KoaContext, instance: any) => any | Promise<any>

export function RequestParams(processor: RequestParamsProcessorFunction):ParameterDecorator {
  return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
    RequestParams.defineMetadata(target.constructor, processor, propertyKey, parameterIndex);
  }
}

RequestParams.defineMetadata = (target: Object, processor: RequestParamsProcessorFunction, propertyKey: string | symbol, parameterIndex: number) => {
  Metadata.defineInsertBeginArrayMetadata(propertyKey, [ processor ], target, parameterIndex.toString());
}

RequestParams.getMetadata = (target: Object, propertyKey: string | symbol, parameterIndex: number): Function[] => {
  return Metadata.getMetadata(propertyKey, target, parameterIndex.toString()) as RequestParamsProcessorFunction[] || [];
}

RequestParams.Context = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context);
}
RequestParams.Custom = (processor: (context: KoaContext, instance?: any) => any):ParameterDecorator => {
  return RequestParams((context: KoaContext, instance) => {
    return processor(context, instance) || context;
  });
}

RequestParams.Request = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.request);
}

RequestParams.Response = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.response);
}

RequestParams.Cookies = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.cookies);
}

RequestParams.Header = (key?: string | string[] | RequestParamsFunction):ParameterDecorator => {
  return RequestParams((context: KoaContext) => {
    const header = context.header;
    if (Array.isArray(key)) {
      return key.reduce<any>((results: any, currentKey: string) => {
        results[currentKey] = header?.[currentKey];
      }, {});
    } else if (typeof key === 'string') {
      return header[key];
    } else if (typeof key === 'function') {
      return key(header, context) || header;
    }

    return header;
  });
}
RequestParams.Host = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.host);
}

RequestParams.Hostname = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.hostname);
}

type RequestParamsFunction = (value: any, context?: KoaContext) => any;

RequestParams.Query = (key?: string | string[] | RequestParamsFunction):ParameterDecorator => {
  return RequestParams((context: KoaContext) => {
    const query = context.query;
    if (Array.isArray(key)) {
      return key.reduce<any>((results: any, currentKey: string) => {
        results[currentKey] = query?.[currentKey];
      }, {});
    } else if (typeof key === 'string') {
      return query?.[key];
    } else if (typeof key === 'function') {
      return key(query, context) || query;
    }
    return query;
  });
}

RequestParams.Body = (key?: string | string[] | RequestParamsFunction):ParameterDecorator => {
  return RequestParams((context: KoaContext) => {
    const body = (context.request as any).body;
    if (Array.isArray(key)) {
      return key.reduce<any>((results: any, currentKey: string) => {
        results[currentKey] = body?.[currentKey];
      }, {});
    } else if (typeof key === 'string') {
      return body?.[key];
    } else if (typeof key === 'function') {
      return key(body, context) || body;
    }

    return body;
  });
}

RequestParams.Params = (key?: string | string[] | RequestParamsFunction):ParameterDecorator => {
  return RequestParams((context: KoaContext) => {
    const params = context.params;
    if (Array.isArray(key)) {
      return key.reduce<any>((results: any, currentKey: string)=>{
        results[currentKey] = params?.[currentKey];
      }, {});
    } else if (typeof key === 'string') {
      return params?.[key];
    } else if (typeof key === 'function') {
      return key(params, context) || params;
    }
    return params;
  });
}

RequestParams.Method = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.method);
} 

RequestParams.Path = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.path);
} 

RequestParams.Url = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.url);
} 

RequestParams.OriginalUrl = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.originalUrl);
} 

RequestParams.Origin = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.origin);
}

RequestParams.Href = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.href);
}

RequestParams.Fresh = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.fresh);
}

RequestParams.Stale = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.stale);
}

RequestParams.Protocol = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.protocol);
}

RequestParams.Secure = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.secure);
}

RequestParams.IP = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.ip);
}

RequestParams.IPs = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.ip);
}

RequestParams.Subdomains = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.subdomains);
}

RequestParams.ContentType = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.request.type);
}

RequestParams.Charset = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context.request.charset);
}

RequestParams.Files = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context['files']);
}

RequestParams.File = ():ParameterDecorator => {
  return RequestParams((context: KoaContext) => context['file']);
}















