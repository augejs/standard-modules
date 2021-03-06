import fs from 'fs';
import path from 'path';

import { ConfigLoader, ScanNode, __appRootDir } from '@augejs/core';

export function JSONConfig(filePath: string = process.env.APP_CONFIG_PATH || path.join(__appRootDir, 'config/app.json'),
  opts?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processor?: (result: any, scanNode: ScanNode) => any | void | Promise<any| void>
  }) :ClassDecorator {
  return ConfigLoader(async (scanNode: ScanNode )=> {    
    // eslint-disable-next-line @typescript-eslint/ban-types
    let result:object = JSON.parse(fs.readFileSync(filePath, 'utf8')) as object;
    if (opts?.processor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processorResult: any = await opts.processor(result, scanNode);
      result = processorResult === undefined ? result : processorResult;
    }
    return result;
  })
}
