# schedule

https://augejs.github.io/docs.augejs.com/


## Install

```bash
npm install @augejs/schedule
```

## Usage

```typescript
import { Application, Logger, ILogger, ConsoleLogTransport, boot, GetLogger , Config} from '@augejs/module-core';
import { ScheduleModule, Schedule } from './main';

Logger.addTransport(new ConsoleLogTransport());

const logger:ILogger = Logger.getLogger('app');

@Application({
  subModules: [
    ScheduleModule,
  ]
})
@Config({
  every5Sec: '*/5 * * * * *'
})
class AppModule {

  @GetLogger()
  logger!:ILogger;

  @Schedule('*/20 * * * * *')
  async every20Sec() {
    logger.info('every20Sec tick');
  }

  @Schedule(config => config.every5Sec)
  async every5SecFromConfig() {
    logger.info('every5SecFromConfig tick');
  }

  @Schedule(`*/4 * * * * *`)
  async every4SecWithLongTime() {
    await new Promise(resolve => {
      setTimeout(resolve, 8000);
    });
  }

  async onInit() {
    logger.info('app on onInit');
  }
}

async function main() {
  await boot(AppModule);
}

main();

```




