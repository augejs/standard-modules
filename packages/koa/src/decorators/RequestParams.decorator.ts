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

RequestParams.Header = (key?: string | string[]):ParameterDecorator => {
  return RequestParams((context: IKoaContext) => {
    const header = context.header;
    if (Array.isArray(key)) {
      return key.reduce<any>((results: any, currentKey: string) => {
        results[currentKey] = header?.[currentKey];
      }, {});
    } else if (typeof key === 'string') {
      return header[key];
    }

    return header;
  });
}
RequestParams.Host = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.host);
}

RequestParams.Hostname = ():ParameterDecorator => {
  return RequestParams((context: IKoaContext) => context.hostname);
}

RequestParams.Query = (key?: string | string[]):ParameterDecorator => {
  return RequestParams((context: IKoaContext) => {
    const query = context.query;
    if (Array.isArray(key)) {
      return key.reduce<any>((results: any, currentKey: string) => {
        results[currentKey] = query?.[currentKey];
      }, {});
    } else if (typeof key === 'string') {
      return query?.[key];
    } 
    return query;
  });
}

RequestParams.Body = (key?: string | string[]):ParameterDecorator => {
  return RequestParams((context: IKoaContext) => {
    const body = (context.request as any).body;
    if (Array.isArray(key)) {
      return key.reduce<any>((results: any, currentKey: string) => {
        results[currentKey] = body?.[currentKey];
      }, {});
    } else if (typeof key === 'string') {
      return body?.[key];
    }

    return body
  });
}

RequestParams.Params = (key?: string | string[]):ParameterDecorator => {
  return RequestParams((context: IKoaContext) => {
    const params = context.params;
    if (Array.isArray(key)) {
      return key.reduce<any>((results: any, currentKey: string)=>{
        results[currentKey] = params?.[currentKey];
      }, {});
    } else if (typeof key === 'string') {
      return params?.[key];
    }
    return params;
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















