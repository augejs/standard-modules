import { 
  ILogger, 
  IScanNode, 
  Metadata, 
  LifecycleOnAppDidReadyHook, 
  Logger 
} from '@augejs/core';

import { CronJob } from 'cron';
import { Schedule } from './Schedule.decorator';

const SCHEDULE_IDENTIFIER = 'schedule';

const logger: ILogger = Logger.getLogger(SCHEDULE_IDENTIFIER);

export function ScheduleManager(): ClassDecorator {
  return function(target: NewableFunction) {
    Metadata.decorate([
      LifecycleOnAppDidReadyHook(
        async (scanNode: IScanNode, next: CallableFunction) => {
          await next();
          const cronJobs: CronJob[] = [];
          for (const task of Schedule.getMetadata()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              const cronJob:CronJob = new CronJob(cron, ()=> {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((cronJob as any).instanceJobRuntime) {
                  // logger.warn(`${task.scanNode.name} ${task.propertyKey.toString()} timeout!`);
                  return;
                }
                (async ()=> {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (cronJob as any).instanceJobRuntime = true;
                  await instance[task.propertyKey](cronJob);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (cronJob as any).instanceJobRuntime = false;
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
