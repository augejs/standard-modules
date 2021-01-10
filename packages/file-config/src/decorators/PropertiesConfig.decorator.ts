import fs from 'fs';
import path from 'path';

import { ConfigLoader, IScanNode, __appRootDir } from '@augejs/module-core';
import properties from 'properties';

// https://github.com/gagle/node-properties#parse

export function PropertiesConfig(filePath: string = process.env.APP_CONFIG_PATH || path.join(__appRootDir, 'config/app.properties'), 
  opts?: {
    processor?: (result: any, scanNode: IScanNode) => any | void | Promise<any| void>
  }) :ClassDecorator {
  return ConfigLoader(async (scanNode: IScanNode )=> {    
    let result:object = properties.parse(fs.readFileSync(filePath, 'utf8'), {
      include: false,
      variables: true,
      namespaces: true,
      sections: true
    }) as object;
    if (opts?.processor) {
      const processorResult: any = await opts.processor(result, scanNode);
      result = processorResult === undefined ? result : processorResult;
    }
    return result;
  })
}
