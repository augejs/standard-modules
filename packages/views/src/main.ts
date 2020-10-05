import consolidate from 'consolidate';
import { minify as htmlMinify } from 'html-minifier';
import path from 'path';
import fs from 'fs';
import { Metadata, IScanNode, ScanHook, Config } from '@augejs/module-core';

export const VIEWS_IDENTIFIER= 'views';

// https://github.com/tj/consolidate.js/

export type ViewOptions = {
  root?: string
  state?: object
  suffixAlias?: object
  minifier?: boolean | object
}

export type RenderFunction = (filePath: string, state?: any) => Promise<string>;

export function Views(opts?: ViewOptions): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      Config({
        [VIEWS_IDENTIFIER]: {
          root: path.join(process.cwd(), 'views'),
          state: {},
          suffixAlias: {},
          // https://github.com/kangax/html-minifier
          minifier: false,
        }
      }),
      ScanHook(
        async (scanNode: IScanNode, next: Function) => {
          const config: any = {
            ...scanNode.context.rootScanNode!.getConfig(VIEWS_IDENTIFIER),
            ...scanNode.getConfig(VIEWS_IDENTIFIER),
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

            let html: string = '';

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

            if (!!minifierOpts) {
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
