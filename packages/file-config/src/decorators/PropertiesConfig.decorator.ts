import fs from 'fs';
import { ConfigLoader, IScanNode } from '@augejs/module-core';
import properties from 'properties';

// https://github.com/gagle/node-properties#parse
export function PropertiesConfig(opts:
  {
    filePath: string,
    processor?: Function
  }) :ClassDecorator {
  return ConfigLoader(async (scanNode: IScanNode )=> {    
    let result:object = properties.parse(fs.readFileSync(opts.filePath, 'utf8'), {
      include: false,
      variables: true,
      namespaces: true,
      sections: true
    }) as object;
    if (opts.processor) {
      result = await opts.processor(result, scanNode);
    }
    return result;
  })
}
