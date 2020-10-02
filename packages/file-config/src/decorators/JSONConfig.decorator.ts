import fs from 'fs';
import { ConfigLoader, IScanNode } from '@augejs/module-core';

export function JsonConfig(filePath: string,
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
