import { Metadata, ScanHook, IScanNode, Injectable, Name, LifecycleOnInitHook } from '@augejs/core';

export type MiddlewareMetadata = {
  scanNode: IScanNode
  propertyKey?: string | symbol,
  hooks: CallableFunction[],
}

export function Middleware(hooks: CallableFunction[] | CallableFunction): ClassDecorator & MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: object | Function, key?: string | symbol) => {
    const isConstructor:boolean = typeof target === 'function';
    const constructor:CallableFunction = isConstructor ? (target as CallableFunction) : target.constructor; 
    Metadata.decorate([
      ScanHook(async (scanNode: IScanNode, next: CallableFunction)=> {
        const metadata: MiddlewareMetadata = {
          scanNode,
          propertyKey: isConstructor ? undefined : key,
          hooks: Array.isArray(hooks) ? hooks : [ hooks ],
        }
        Middleware.defineMetadata(constructor, metadata);
        await next();
      })
    ], constructor);
  }
}

export function MiddlewareHandler(): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Object, key: string | symbol) => {
    Metadata.decorate([
      ScanHook(async (scanNode: IScanNode, next: CallableFunction)=> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instance: any = scanNode.instance;
        if (!instance) return;

        if(typeof instance[key] !== 'function') return;
        // here we need to add to the parent scan node provider.
        const hook: CallableFunction = (instance[key] as CallableFunction).bind(instance) as CallableFunction;
        const metadata: MiddlewareMetadata = {
          scanNode,
          hooks: [hook],
        }
        Middleware.defineMetadata(target.constructor, metadata);
        await next();
      })
    ], target.constructor);
  }
}

export function MiddlewareFactory(factory: CallableFunction): ClassDecorator & MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: object | Function, key?: string | symbol) => {
    const isConstructor:boolean = typeof target === 'function';
    const constructor:CallableFunction = isConstructor ? (target as CallableFunction) : target.constructor; 
    Metadata.decorate([
      LifecycleOnInitHook(async (scanNode: IScanNode, next: CallableFunction)=> {
        const hooks: CallableFunction[] | CallableFunction = await factory(scanNode);
        const metadata: MiddlewareMetadata = {
          scanNode,
          propertyKey: isConstructor ? undefined : key,
          hooks: Array.isArray(hooks) ? hooks : [ hooks ],
        }
        Middleware.defineMetadata(constructor, metadata);
        await next();
      })
    ], constructor);
  }
}

export function HostMiddleware(methodName = 'use'): ClassDecorator {
  return (target: NewableFunction) => {
    Metadata.decorate([
      Injectable(),
      Name(),
      ScanHook(async (scanNode: IScanNode, next: CallableFunction)=> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instance: any = scanNode.instance;
        if (!instance) return;

        if(typeof instance[methodName] !== 'function') return;
        // here we need to add to the parent scan node provider.
        const hook: CallableFunction = (instance[methodName] as CallableFunction).bind(instance) as CallableFunction;
        
        const metadata: MiddlewareMetadata = {
          scanNode: scanNode.parent!,
          hooks: [ hook ],
        }
        Middleware.defineMetadata(scanNode.parent!.provider, metadata);
        await next();
      })
    ], target);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
Middleware.defineMetadata = (target: object, metadata: MiddlewareMetadata) => {
  Metadata.defineInsertEndArrayMetadata(Middleware, [ metadata ], target);
}

// eslint-disable-next-line @typescript-eslint/ban-types
Middleware.getMetadata = (target: object):MiddlewareMetadata[] => {
  return Metadata.getMetadata(Middleware, target) as MiddlewareMetadata[] || [];
}
