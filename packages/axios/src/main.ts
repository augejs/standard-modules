import { Config, Metadata, ScanHook, IScanNode } from '@augejs/core';

import Axios, { AxiosRequestConfig } from 'axios';

export * from 'axios';

export const ConfigName = 'axios';

export const AXIOS_IDENTIFIER = Symbol.for(ConfigName);

export function AxiosConfig(opts?: AxiosRequestConfig): ClassDecorator {
  return function(target: NewableFunction) {
    Metadata.decorate([
      Config({
        [ConfigName]: {
          timeout: 5000,
          withCredentials: false,
          ...opts,
        }
      }),

      ScanHook(async (scanNode: IScanNode, next: CallableFunction) => {
        const config: AxiosRequestConfig = {
          ...scanNode.context.rootScanNode!.getConfig(ConfigName),
          ...scanNode.getConfig(ConfigName)
        };

        Object.assign(Axios.defaults, config);

        scanNode.context.container.bind(AXIOS_IDENTIFIER).toConstantValue(Axios);
        await next();
      })
    ], target);
  }
}
