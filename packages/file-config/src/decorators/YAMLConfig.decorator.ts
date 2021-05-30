import yaml from 'js-yaml';
import fs from 'fs';
import { ConfigLoader, ScanNode, __appRootDir } from '@augejs/core';
import path from 'path';

export function YAMLConfig(filePath: string = process.env.APP_CONFIG_PATH || path.join(__appRootDir, 'config/app.yml'), 
  opts?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processor?: (result: any, scanNode: ScanNode) => any | void | Promise<any| void> 
  }) :ClassDecorator {
  return ConfigLoader(async (scanNode: ScanNode )=> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result:any = yaml.load(fs.readFileSync(filePath, 'utf8'));
    if (opts?.processor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processorResult: any = await opts.processor(result, scanNode);
      result = processorResult === undefined ? result : processorResult;
    }
    return result;
  })
}
