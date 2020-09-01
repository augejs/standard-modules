import { Sequelize as SequelizeClient } from "sequelize"
import { Config, LifecycleOnInitHook, IScanNode, Metadata, ScanHook } from '@augejs/module-core'

export const SEQUELIZE_IDENTIFIER = 'sequelize';

export function Sequelize(opts?: any): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      Config({
        [SEQUELIZE_IDENTIFIER]: {
          type: "mysql",
          host: "localhost",
          port: 3306,
          username: "root",
          password: "admin",
          database: "test",
        }
      }),
      ScanHook(async (scanNode: IScanNode, next: Function) => {
        const config: any = {
          ...scanNode.context.rootScanNode!.getConfig(SEQUELIZE_IDENTIFIER),
          ...scanNode.getConfig(SEQUELIZE_IDENTIFIER),
          ...opts,
        }

        scanNode.context.container.bind(SEQUELIZE_IDENTIFIER).toConstantValue(new SequelizeClient(config));
      }),
      LifecycleOnInitHook(async (scanNode: IScanNode, next: Function) => {
        const sequelize: SequelizeClient = scanNode.context.container.get<SequelizeClient>(SEQUELIZE_IDENTIFIER);
        await sequelize.authenticate();
        await next();
      })
    ], target)
  }
}
