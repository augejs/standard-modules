import nodemailer from 'nodemailer';
import { Metadata, IScanNode, ScanHook } from '@augejs/module-core';
import Mail from 'nodemailer/lib/mailer';

export {
  Mail
}

// https://nodemailer.com/about/

export const ConfigName = 'mail';

const MAIL_IDENTIFIER = Symbol.for(ConfigName);

export function MailTransport(opts?: any): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      ScanHook(
        async (scanNode: IScanNode, next: Function) => {
          const config: any = {
            ...scanNode.context.rootScanNode?.getConfig(ConfigName),
            ...scanNode.getConfig(ConfigName),
            ...opts
          }
          const mail = nodemailer.createTransport(config);
          scanNode.context.container.bind(MAIL_IDENTIFIER).toConstantValue(mail);
          await next();
        }
      ),
    ],target)
  }
}
