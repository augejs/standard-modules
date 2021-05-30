import { ScanNode, Metadata, ScanHook } from "@augejs/core";

interface Subscriber  {
  scanNode: ScanNode,
  channel: string,
  propertyKey: string | symbol
}

export function SubscribeMessage(channel: string): MethodDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target:Object, propertyKey:string | symbol, descriptor: PropertyDescriptor) => {
    Metadata.decorate([
      ScanHook(async (scanNode: ScanNode, next: CallableFunction) => {
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
  return Metadata.getMetadata(SubscribeMessage, SubscribeMessage) as Subscriber[] || [];
}
