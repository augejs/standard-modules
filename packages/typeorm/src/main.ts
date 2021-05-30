import { createConnection, createConnections, ConnectionOptions, getMetadataArgsStorage  } from "typeorm"
import { Metadata, ScanHook, ScanNode } from '@augejs/core'

const ConfigName = 'typeorm';

export * from 'typeorm';


// getMetadataArgsStorage

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processDefaultEntities(config: any):void {
  if (!config) return;
  if (config.entities) return;

  config.entities = getMetadataArgsStorage()
    .tables
    .filter(table => typeof table.target === 'function')
    .map(table => table.target); 
}

// https://typeorm.io/#/connection
export function Typeorm(opts?: Partial<ConnectionOptions>  | Partial<ConnectionOptions>[]): ClassDecorator {
  return function(target: NewableFunction) {
    Metadata.decorate([
      ScanHook(async (scanNode: ScanNode, next: CallableFunction) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rootConfig: Partial<ConnectionOptions> | Partial<ConnectionOptions>[] | null = scanNode.context.rootScanNode!.getConfig(ConfigName) ?? null;
        const optsConfig: Partial<ConnectionOptions> | Partial<ConnectionOptions>[] | null = opts ?? null;

        let config: unknown;

        if (Array.isArray(rootConfig) && !Array.isArray(optsConfig)) {
          config = rootConfig.map(configItem => {
            return {
              ...configItem,
              ...optsConfig
            }
          });
        } else if (!Array.isArray(rootConfig) && Array.isArray(optsConfig)) {
          config = optsConfig.map(configItem => {
            return {
              ...rootConfig,
              ...configItem
            }
          });
        } else if (!Array.isArray(rootConfig) && !Array.isArray(optsConfig)) {
          config = {
            ...rootConfig,
            ...optsConfig,
          }
        } else if (Array.isArray(rootConfig) && Array.isArray(optsConfig)) {
          const connectionNames = new Set<string>();
          const rootConnectionConfigHash: Record<string, unknown> = {};
          rootConfig.forEach((configItem) => {
            const connectionName = configItem.name ?? 'default';
            connectionNames.add(connectionName);
            rootConnectionConfigHash[connectionName] =  configItem;
          })

          const optsConnectionConfigHash: Record<string, unknown> = {};
          optsConfig.forEach((configItem) => {
            const connectionName = configItem.name ?? 'default';
            connectionNames.add(connectionName);
            optsConnectionConfigHash[connectionName] =  configItem;
          })

          config = [];
          for (const connectionName of connectionNames) {
            const rootConnectionConfigItem = rootConnectionConfigHash[connectionName];
            const optsConnectionConfigItem = optsConnectionConfigHash[connectionName];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (config as any[]).push({
              // eslint-disable-next-line @typescript-eslint/ban-types
              ...rootConnectionConfigItem as object,
              // eslint-disable-next-line @typescript-eslint/ban-types
              ...optsConnectionConfigItem as object,
            });
          }
        }
        
        // const connections: Connection[] = [];
        if (Array.isArray(config)) {
          // const connections: Connection[] = await createConnections(config);
          // here we add the automatic entities
          config.forEach(configItem => processDefaultEntities(configItem));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await createConnections(config as any);
          // connections.push(...connections);
        } else {
          // const connection: Connection = await createConnection(config);
          // connections.push(connection);

          processDefaultEntities(config);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await createConnection(config as any);
        }

        await next();
        // scanNode.context.container.bind(TYPE_ORM_IDENTIFIER).toConstantValue(connections);
      }),

      // LifecycleOnInitHook(async (scanNode: IScanNode, next: Function) => {
      //   const connections: Connection[] = scanNode.context.container.get<Connection[]>(TYPE_ORM_IDENTIFIER);
      //   await Promise.all(connections.map((connection: Connection) => {
      //     return connection.connect();
      //   }));
      //   await next();
      // })
    ], target)
  }
}






