import yaml from 'js-yaml';
import fs from 'fs';
import { ConfigLoader, IScanNode } from '@augejs/module-core';

export function YAMLConfig(opts: 
  { filePath: string, 
    processor?: Function }) :ClassDecorator {
  return ConfigLoader(async (scanNode: IScanNode )=> {
    if (!opts.filePath) return;
    let result:object = yaml.safeLoad(fs.readFileSync(opts.filePath, 'utf8')) as object;
    if (opts.processor) {
      result = await opts.processor(result, scanNode);
    }
    return result;
  })
}
