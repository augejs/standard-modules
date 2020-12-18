import { 
  ILogger, 
  IScanNode, 
  Metadata, 
  LifecycleOnAppDidReadyHook, 
  Logger 
} from '@augejs/module-core';

import { CronJob } from 'cron';
import { Schedule } from './Schedule.decorator';

const SCHEDULE_IDENTIFIER = 'schedule';

const logger: ILogger = Logger.getLogger(SCHEDULE_IDENTIFIER);

export function ScheduleManager(): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      LifecycleOnAppDidReadyHook(
        async (scanNode: IScanNode, next: Function) => {
          await next();
          const cronJobs: CronJob[] = [];
          for (const task of Schedule.getMetadata()) {
            const instance: any = task.scanNode.instance;
            if (!instance) continue;
            if (typeof instance[task.propertyKey] !== 'function') continue;

            let cron:string | null;
            if (typeof task.cron === 'function') {
              cron = await task.cron(task.scanNode) || null;
            } else {
              cron = task.cron as string;
            }

            if (!cron) {
              logger.warn(`${task.scanNode.name} ${task.propertyKey.toString()} cron is empty!`);
              continue;
            }

            try {
              const cronJob:CronJob = new CronJob(cron, (...args:any[])=> {
                if (cronJob.instanceJobRuntime) {
                  // logger.warn(`${task.scanNode.name} ${task.propertyKey.toString()} timeout!`);
                  return;
                }
                (async ()=> {
                  cronJob.instanceJobRuntime = true;
                  await instance[task.propertyKey](cronJob);
                  cronJob.instanceJobRuntime = false;
                })();
              });

              cronJobs.push(cronJob);
            } catch (err) {
              logger.error(`${task.scanNode.name} ${task.propertyKey.toString()} cron is invalid! \n ${err}`);
            }
          }
        
          cronJobs.forEach((job: CronJob) => {
            job.start();
          });
        }
      )
    ], target);
  }
}
