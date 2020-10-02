import fs from 'fs';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { ConfigLoader, IScanNode } from '@augejs/module-core';

export function DotENVConfig(filePath: string,
  opts?: {
  processor?: (result: any, scanNode: IScanNode) => any | void | Promise<any| void>
}) :ClassDecorator {
  return ConfigLoader(async (scanNode: IScanNode )=> {
    let result:any = dotenvExpand(dotenv.parse(fs.readFileSync(filePath, 'utf8')));
    if (opts?.processor) {
      const processorResult: any = await opts.processor(result, scanNode);
      result = processorResult === undefined ? result : processorResult;
    }
    return result;
  })
}
