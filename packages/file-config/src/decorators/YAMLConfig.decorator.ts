import yaml from 'js-yaml';
import fs from 'fs';
import { ConfigLoader, IScanNode, __appRootDir } from '@augejs/core';
import path from 'path';

export function YAMLConfig(filePath: string = process.env.APP_CONFIG_PATH || path.join(__appRootDir, 'config/app.yml'), 
  opts?: {
    processor?: (result: any, scanNode: IScanNode) => any | void | Promise<any| void> 
  }) :ClassDecorator {
  return ConfigLoader(async (scanNode: IScanNode )=> {
    let result:any = yaml.load(fs.readFileSync(filePath, 'utf8'));
    if (opts?.processor) {
      const processorResult: any = await opts.processor(result, scanNode);
      result = processorResult === undefined ? result : processorResult;
    }
    return result;
  })
}
