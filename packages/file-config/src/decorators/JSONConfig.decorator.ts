import fs from 'fs';
import { ConfigLoader, IScanNode } from '@augejs/module-core';

export function JsonConfig(opts:
  {
    filePath: string,
    processor?: Function
  }) :ClassDecorator {
  return ConfigLoader(async (scanNode: IScanNode )=> {    
    let result:object = JSON.parse(fs.readFileSync(opts.filePath, 'utf8')) as object;
    if (opts.processor) {
      result = await opts.processor(result, scanNode);
    }
    return result;
  })
}
