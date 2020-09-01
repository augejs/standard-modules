import { Metadata, ScanHook, IScanNode, Injectable, Name } from '@augejs/module-core';

export type MiddlewareMetadata = {
  scanNode: IScanNode
  propertyKey?: string | symbol,
  hooks: Function[],
}

export function Middleware(hooks: Function[] | Function): ClassDecorator & MethodDecorator {;
  return (target: object | Function, key?: string | symbol) => {
    const isConstructor:boolean = typeof target === 'function';
    const constructor:Function = isConstructor ? (target as Function) : target.constructor; 
    Metadata.decorate([
      ScanHook(async (scanNode: IScanNode, next: Function)=> {
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

export function MiddlewareFactory(factory: Function): ClassDecorator & MethodDecorator {
  return (target: object | Function, key?: string | symbol) => {
    const isConstructor:boolean = typeof target === 'function';
    const constructor:Function = isConstructor ? (target as Function) : target.constructor; 
    Metadata.decorate([
      ScanHook(async (scanNode: IScanNode, next: Function)=> {
        const hooks: Function[] | Function = await factory(scanNode);
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

export function HostMiddleware(): ClassDecorator {
  return (target: Function) => {
    Metadata.decorate([
      Injectable(),
      Name(),
      ScanHook(async (scanNode: IScanNode, next: Function)=> {
        await next();
        const instance: any = scanNode.instance;
        if (!instance) return;
        if(typeof instance.use !== 'function') return;
        // here we need to add to the parent scan node provider.
        const hook: Function = (instance.use as Function).bind(instance);
        const metadata: MiddlewareMetadata = {
          scanNode: scanNode.parent!,
          hooks: [ hook ],
        }
        Middleware.defineMetadata(scanNode.parent!.provider, metadata);
      })
    ], target);
  }
}

Middleware.defineMetadata = (target: object, metadata: MiddlewareMetadata) => {
  Metadata.defineInsertEndArrayMetadata(Middleware, [ metadata ], target);
}

Middleware.getMetadata = (target: object):MiddlewareMetadata[] => {
  return Metadata.getMetadata(Middleware, target) || [];
}
