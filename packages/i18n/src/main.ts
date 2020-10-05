import path from 'path';
import fs from 'fs';
import { Metadata, IScanNode, ScanHook, Config } from '@augejs/module-core';
import yaml from 'js-yaml';
import properties from 'properties';
import {createIntl, createIntlCache, IntlShape, CustomFormats, OnErrorFn } from '@formatjs/intl'

export const I18N_IDENTIFIER = 'i18n';

export interface II18n<T=string> extends IntlShape<T> {
  get(locale: string): IntlShape<T>
}

function flattening(data:any) {
  const result = {};
  function deepFlat(data, keys: string) {
    Object.keys(data).forEach(function (key) {
      const value: any = data[key];
      const k = keys ? keys + '.' + key : key;
      if (Object.prototype.toString.call(value) === '[object Object]') {
        deepFlat(value, k);
      } else {
        result[k] = String(value);
      }
    });
  }

  deepFlat(data, '');
  return result;
}

// https://formatjs.io/docs/intl

interface I18nOptions {
  root?: string
  defaultLocale?: string
  formats?: CustomFormats
  messages?: Record<string, string>
  defaultFormats?: CustomFormats
  defaultRichTextElements?: Record<string, any>
  onError?: OnErrorFn
}

export function I18n(opts?: I18nOptions): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      Config({
        [I18N_IDENTIFIER]: {
          root: path.join(process.cwd(), 'locales'),
          defaultLocale: 'en',
          formats: null,
          messages: null,
          onError: null,
          defaultFormats: null,
          defaultRichTextElements: null,
        }
      }),
      ScanHook(
        async (scanNode: IScanNode, next: Function) => {
          const config: any = {
            ...scanNode.context.rootScanNode?.getConfig(I18N_IDENTIFIER),
            ...scanNode.getConfig(I18N_IDENTIFIER),
            ...opts
          };

          const localeDir: string = config.root;
          let defaultLocale: string = config.defaultLocale || 'en';

          const intlMap: Record<string, IntlShape<any>> = {};

          if (fs.existsSync(localeDir)) {

            for (const localeFileName of fs.readdirSync(localeDir)) {
              if (localeFileName.startsWith('_')) continue;

              const fileExtName: string = path.extname(localeFileName);
              const localeFilepath = path.join(localeDir, localeFileName);
              const fileContent:string = fs.readFileSync(localeFilepath, 'utf8');
              
              const localeName: string = path.basename(localeFileName, fileExtName);
              let localeMessages: Record<string, string> = {};

              if (fileExtName === '.json') {
                localeMessages = JSON.parse(fileContent);
              } else if (fileExtName === '.properties') {
                localeMessages = properties.parse(fileContent);
              } else if (fileExtName === '.yml' || fileExtName === '.yaml') {
                localeMessages = yaml.safeLoad(fileContent) as Record<string, string>;
              }

              if (!localeMessages) continue;

              localeMessages = flattening(localeMessages);

              const intl = createIntl({
                locale: localeName,
                defaultLocale: localeName,
                messages: {
                  ...config.messages,
                  ...localeMessages,
                },
                formats: config.formats,
                defaultRichTextElements: config.defaultRichTextElements,
                defaultFormats: config.defaultFormats,
                onError: config.onError},
                createIntlCache(),
              );

              intlMap[localeName] = intl;
            }
          };

          const localNames = Object.keys(intlMap);
          if (localNames.length > 0) {
            if (!localNames.includes(defaultLocale)) {
              defaultLocale = localNames[0]
            }
          } else {
            intlMap[defaultLocale] = createIntl({
              locale: defaultLocale,
              defaultLocale: defaultLocale,
              messages: {
                ...config.messages,
              },
              formats: config.formats,
              defaultRichTextElements: config.defaultRichTextElements,
              defaultFormats: config.defaultFormats,
              onError: config.onError},
              createIntlCache(),
            );
          }

          let defaultI18n = intlMap[defaultLocale];

          for (const intl of Object.values(intlMap)) {
            Object.assign(intl, {
              get<T=string>(locale: string):IntlShape<T> {
                return intlMap[locale] || defaultI18n;
              }
            });
          }

          scanNode.context.container.bind(I18N_IDENTIFIER).toConstantValue(defaultI18n);
          await next();
        }
      ),
    ],target)
  }
}