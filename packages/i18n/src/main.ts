import path from 'path';
import fs from 'fs';
import { Metadata, ScanNode, ScanHook, Config, __appRootDir } from '@augejs/core';
import yaml from 'js-yaml';
import properties from 'properties';
import {createIntl, createIntlCache, IntlShape, CustomFormats, OnErrorFn } from '@formatjs/intl'

export const ConfigName = 'i18n';

export const I18N_IDENTIFIER = Symbol.for(ConfigName);

export interface II18n<T=string> extends IntlShape<T> {
  get(locale: string): IntlShape<T>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattening(data:any) {
  const result = {};
  function deepFlat(data, keys: string) {
    Object.keys(data).forEach(function (key) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  defaultRichTextElements?: Record<string, unknown>
  onError?: OnErrorFn
}

export function I18n(opts?: I18nOptions): ClassDecorator {
  return function(target: NewableFunction) {
    Metadata.decorate([
      Config({
        [ConfigName]: {
          root: path.join(__appRootDir, 'locales'),
          defaultLocale: 'en',
          formats: null,
          messages: null,
          onError: null,
          defaultFormats: null,
          defaultRichTextElements: null,
        }
      }),
      ScanHook(
        async (scanNode: ScanNode, next: CallableFunction) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const config: any = {
            ...scanNode.context.rootScanNode?.getConfig(ConfigName),
            ...scanNode.getConfig(ConfigName),
            ...opts
          };

          const localeDir: string = config.root;
          let defaultLocale: string = config.defaultLocale || 'en';

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                localeMessages = yaml.load(fileContent) as Record<string, string>;
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
          }

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

          const defaultI18n = intlMap[defaultLocale];

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
