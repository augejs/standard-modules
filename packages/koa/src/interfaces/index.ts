import Router from '@koa/router';
import Application, { Context } from 'koa';

import { 
  IScanContext, 
} from "@augejs/core";

export interface IKoaApplication extends Application {
  router: Router
  [key: string] : any
}

export interface IKoaContext extends Context {
  scanContext: IScanContext
}
