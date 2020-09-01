import fs from 'fs';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { ConfigLoader, IScanNode } from '@augejs/module-core';

export function DotENVConfig(opts: {
  filePath: string,
  processor?: Function
}) :ClassDecorator {
  return ConfigLoader(async (scanNode: IScanNode )=> {

    let result:object = dotenvExpand(dotenv.parse(fs.readFileSync(opts.filePath, 'utf8'))) as object;
    if (opts.processor) {
      result = await opts.processor(result, scanNode);
    }

    return result;
  })
}
