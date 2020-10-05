import { IScanNode, Metadata, ScanHook } from '@augejs/module-core';

/**
 * 
 * The cron format consists of:
 * *    *    *    *    *    *
 * ┬    ┬    ┬    ┬    ┬    ┬
 * │    │    │    │    │    │
 * │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 * │    │    │    │    └───── month (1 - 12)
 * │    │    │    └────────── day of month (1 - 31)
 * │    │    └─────────────── hour (0 - 23)
 * │    └──────────────────── minute (0 - 59)
 * │    └──────────────────── minute (0 - 59) 
 * └───────────────────────── second (0 - 59, OPTIONAL)
 * 
 */


// Module, Service method only. method will execute after app start.

export function Schedule(cron:string | Function):MethodDecorator {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Metadata.decorate([
      ScanHook(async (scanNode: IScanNode, next: Function) => {
        Schedule.defineMetadata({
          scanNode,
          propertyKey,
          cron,
        });
        await next();
      })
    ], target.constructor);

    return descriptor;
  }
}

export type ScheduleTask = {
  scanNode: IScanNode,
  cron: string | Function,
  propertyKey: string | symbol
}

Schedule.defineMetadata = (value: ScheduleTask) => {
  Metadata.defineInsertEndArrayMetadata(Schedule, [ value ], Schedule);
}

Schedule.getMetadata = (): ScheduleTask[]  => {
  return Metadata.getMetadata(Schedule, Schedule);
}