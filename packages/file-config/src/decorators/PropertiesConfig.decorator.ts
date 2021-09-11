import fs from 'fs';
import path from 'path';

import { ConfigLoader, ScanNode, __appRootDir } from '@augejs/core';
import properties from 'properties';
import { FileConfigOpts } from './FileConfigOpts';

// https://github.com/gagle/node-properties#parse

export function PropertiesConfig(opts?: FileConfigOpts) :ClassDecorator {
  return ConfigLoader(async (scanNode: ScanNode )=> {  
    const filePath = opts?.filePath || process.env.APP_CONFIG_PATH || path.join(__appRootDir, 'config/app.properties');
    // eslint-disable-next-line @typescript-eslint/ban-types
    let result:object = properties.parse(fs.readFileSync(filePath, 'utf8'), {
      include: false,
      variables: true,
      namespaces: true,
      sections: true
    // eslint-disable-next-line @typescript-eslint/ban-types
    }) as object;
    if (opts?.processor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processorResult: any = await opts.processor(result, scanNode);
      result = processorResult === undefined ? result : processorResult;
    }
    return result;
  })
}
