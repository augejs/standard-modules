import { 
  ILogger, 
  boot, 
  GetLogger, 
  Value,
  Module,
  IScanNode
} from '@augejs/module-core';

import {
  KoaWebServer,
  Middleware, 
  HostMiddleware,
  Prefix, 
  RequestMapping,
  RequestParams,
  } from './main';

import { Context } from 'koa';

@HostMiddleware()
class ClassMiddleware {

  @GetLogger()
  logger!:ILogger;

  async use(context: Context, next: Function) {
    this.logger.info('========>>>>>HostMiddleware 1');
    await next();
    this.logger.info('========>>>>>HostMiddleware 2');
  }
}

@Prefix('/module')
@Middleware(
  async (context: Context, next: Function) => {
    console.log('========>>>>>1 start');
    await next();
    console.log('========>>>>>1 end');
  }
)
@Module({
  providers: [
    ClassMiddleware,
  ]
})
class Module1 {
  @GetLogger()
  logger!:ILogger;

  @RequestMapping()
  @Middleware(
    async (context: Context, next: Function) => {
      console.log('========>>>>>2 start');
      await next();
      console.log('========>>>>>2 end');
    }
  )
  test(@RequestParams.Context() context: Context) {
    this.logger.info(`route test ${context}`);
    return {
      name: 'hello'
    }
  }
}

@KoaWebServer()
@Module({
  subModules: [
    Module1,
  ]
})
class AppModule {

  @GetLogger()
  logger!:ILogger;

  @Value('/')
  globalConfig!:object;

  async onInit(scanNode: IScanNode) {
    this.logger.info('app on onInit' + JSON.stringify(scanNode.getConfig('/')));
  }

  async onAppWillReady() {
    this.logger.info('app on onAppWillReady');
  }

  async onAppDidReady() {
    this.logger.info('app on onAppDidReady');
  }
}

async function main() {
  await boot(AppModule);
}

main();
