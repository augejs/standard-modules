import Router from '@koa/router';
import Application, { Context } from 'koa';

import { 
  ScanContext, 
} from "@augejs/core";

export interface KoaApplication extends Application {
  router: Router
  [key: string] : unknown
}

export interface KoaContext extends Context {
  scanContext: ScanContext
}
