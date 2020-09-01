import { Module, Logger, ILogger, boot } from '@augejs/module-core';
import { Log4js } from './main';

const logger:ILogger = Logger.getLogger('app');

@Log4js()
@Module()
class AppModule {

  async onInit() {
    logger.info('app on onInit');
  }
}

async function main() {
  await boot(AppModule);
}

main();

