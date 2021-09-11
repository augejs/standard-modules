import fs from 'fs';
import path from 'path';

import { ConfigLoader, ScanNode, __appRootDir } from '@augejs/core';
import { FileConfigOpts } from './FileConfigOpts';

export function JSONConfig(opts?: FileConfigOpts) :ClassDecorator {
  return ConfigLoader(async (scanNode: ScanNode )=> {    
    const filePath = opts?.filePath || process.env.APP_CONFIG_PATH || path.join(__appRootDir, 'config/app.json');
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
