import { Config, Metadata, ScanHook, IScanNode } from '@augejs/module-core';
import Axios, { AxiosInstance } from 'axios';

export {
  AxiosInstance
}

export const AXIOS_IDENTIFIER = 'axios';

export function AxiosConfig(opts?: Record<string, any>): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      Config({
        [AXIOS_IDENTIFIER]: {
          timeout: 5000,
          withCredentials: false,
          ...opts,
        }
      }),

      ScanHook(async (scanNode: IScanNode, next: Function) => {
        const config: any = {
          ...scanNode.context.rootScanNode!.getConfig(AXIOS_IDENTIFIER),
          ...scanNode.getConfig(AXIOS_IDENTIFIER)
        };

        scanNode.context.container.bind(AXIOS_IDENTIFIER).toConstantValue(Axios.create(config));
        await next();
      })
    ], target);
  }
}
