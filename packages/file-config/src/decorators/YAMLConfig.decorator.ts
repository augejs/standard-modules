import yaml from 'js-yaml';
import fs from 'fs';
import { ConfigLoader, ScanNode, __appRootDir } from '@augejs/core';
import path from 'path';
import { FileConfigOpts } from './FileConfigOpts';

export function YAMLConfig(opts?: FileConfigOpts) :ClassDecorator {
  return ConfigLoader(async (scanNode: ScanNode )=> {
    const filePath = opts?.filePath || process.env.APP_CONFIG_PATH || path.join(__appRootDir, 'config/app.yml');
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
