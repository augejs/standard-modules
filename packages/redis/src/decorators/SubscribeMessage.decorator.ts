import { IScanNode, Metadata, ScanHook } from "@augejs/core";

interface Subscriber  {
  scanNode: IScanNode,
  channel: string,
  propertyKey: string | symbol
}

export function SubscribeMessage(channel: string): MethodDecorator {
  return (target:Object, propertyKey:string | symbol, descriptor: PropertyDescriptor) => {
    Metadata.decorate([
      ScanHook(async (scanNode: IScanNode, next: Function) => {
        SubscribeMessage.defineMetadata({
          scanNode,
          propertyKey,
          channel,
        });
        await next();
      })
    ], target.constructor);

    return descriptor;
  }
}

SubscribeMessage.defineMetadata = (metadata: Subscriber) => {
  Metadata.defineInsertEndArrayMetadata(SubscribeMessage, [ metadata ], SubscribeMessage);
}

SubscribeMessage.getMetadata = ():Subscriber[] => {
  return Metadata.getMetadata(SubscribeMessage, SubscribeMessage) || [];
}