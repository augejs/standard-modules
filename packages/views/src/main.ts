/* eslint-disable @typescript-eslint/no-explicit-any */
import consolidate from 'consolidate';
import { minify as htmlMinify } from 'html-minifier';
import path from 'path';
import fs from 'fs';
import { Metadata, ScanNode, ScanHook, Config, __appRootDir } from '@augejs/core';

export const ConfigName = 'views';
export const VIEWS_IDENTIFIER= Symbol.for(ConfigName);

// https://github.com/tj/consolidate.js/

export type ViewOptions = {
  root?: string
  state?: Record<string, unknown>
  suffixAlias?: Record<string, unknown>
  minifier?: boolean | Record<string, unknown>
}

export type RenderFunction = (filePath: string, state?: any) => Promise<string>;

export function Views(opts?: ViewOptions): ClassDecorator {
  return function(target: NewableFunction) {
    Metadata.decorate([
      Config({
        [ConfigName]: {
          root: path.join(__appRootDir, 'views'),
          state: {},
          suffixAlias: {},
          // https://github.com/kangax/html-minifier
          minifier: false,
        }
      }),
      ScanHook(
        async (scanNode: ScanNode, next: CallableFunction) => {
          const config = {
            ...scanNode.context.rootScanNode!.getConfig(ConfigName),
            ...scanNode.getConfig(ConfigName),
            ...opts,
          };

          const rootPath: string = config.root;
          const suffixAlias: any = config.suffixAlias;
          const optsState: any = config.state;
          const minifierOpts: any = config.minifier;

          async function render(filePath: string, state?: any) {
            let suffix: string = path.extname(filePath).slice(1);
            if (suffixAlias) {
              suffix = suffixAlias[suffix] || suffix;
            }

            const fileAbsPath: string = path.join(rootPath, filePath);

            let html = '';

            if (suffix === 'html') {
              html = fs.readFileSync(fileAbsPath, 'utf8');
            } else {
              state = {
                ...optsState,
                ...state,
                partials: {
                  ...optsState?.partials,
                  ...state?.partials,
                }
              }
  
              const templateRender = consolidate[suffix];
              if (!render) {
                throw new Error(`Template Engine is not support for '.${suffix}'`)
              }
              
              html = await templateRender(fileAbsPath, state);
            }

            if (minifierOpts) {
              html = htmlMinify(html, minifierOpts);
            }

            return html;
          }

          scanNode.context.container.bind(VIEWS_IDENTIFIER).toConstantValue(render);

          await next();
        }
      ),
    ],target)
  }
}
