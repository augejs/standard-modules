import { Connection, createConnection, createConnections, ConnectionOptions } from "typeorm"
import { Metadata, ScanHook, IScanNode, LifecycleOnInitHook } from '@augejs/module-core'

const ConfigName = 'typeorm';
const TYPE_ORM_IDENTIFIER = Symbol.for(ConfigName);

export * from 'typeorm';

// https://typeorm.io/#/connection
export function Typeorm(opts?: ConnectionOptions | ConnectionOptions[]): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      ScanHook(async (scanNode: IScanNode, next: Function) => {
        const config: any = {
          ...scanNode.context.rootScanNode!.getConfig(ConfigName),
          ...scanNode.getConfig(ConfigName),
          ...opts,
        };
        
        const connections: Connection[] = [];
        if (Array.isArray(config)) {
          const connections: Connection[] = await createConnections(config);
          connections.push(...connections);
        } else {
          const connection: Connection = await createConnection(config);
          connections.push(connection);
        }
        scanNode.context.container.bind(TYPE_ORM_IDENTIFIER).toConstantValue(connections);
      }),

      LifecycleOnInitHook(async (scanNode: IScanNode, next: Function) => {
        const connections: Connection[] = scanNode.context.container.get<Connection[]>(TYPE_ORM_IDENTIFIER);
        await Promise.all(connections.map((connection: Connection) => {
          return connection.connect();
        }));

        await next();
      })
    ], target)
  }
}

