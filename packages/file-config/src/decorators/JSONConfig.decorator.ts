import fs from 'fs';
import path from 'path';

import { ConfigLoader, IScanNode, __appRootDir } from '@augejs/module-core';

export function JSONConfig(filePath: string = process.env.APP_CONFIG_PATH || path.join(__appRootDir, 'config/app.json'),
  opts?: {
    processor?: (result: any, scanNode: IScanNode) => any | void | Promise<any| void>
  }) :ClassDecorator {
  return ConfigLoader(async (scanNode: IScanNode )=> {    
    let result:object = JSON.parse(fs.readFileSync(filePath, 'utf8')) as object;
    if (opts?.processor) {
      const processorResult: any = await opts.processor(result, scanNode);
      result = processorResult === undefined ? result : processorResult;
    }
    return result;
  })
}
