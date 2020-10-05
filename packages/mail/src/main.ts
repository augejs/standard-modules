import nodemailer from 'nodemailer';
import { Metadata, IScanNode, ScanHook } from '@augejs/module-core';
import Mail from 'nodemailer/lib/mailer';

export const MAIL_TOKEN = 'MAIL_TOKEN';

export {
  Mail
}

// https://nodemailer.com/about/

const MAIL_IDENTIFIER = 'mail';

export function MailTransport(opts?: any): ClassDecorator {
  return function(target: Function) {
    Metadata.decorate([
      ScanHook(
        async (scanNode: IScanNode, next: Function) => {
          const config: any = {
            ...scanNode.context.rootScanNode?.getConfig(MAIL_IDENTIFIER),
            ...scanNode.getConfig(MAIL_IDENTIFIER),
            ...opts
          }
          const mail = nodemailer.createTransport(config);
          scanNode.context.container.bind(MAIL_TOKEN).toConstantValue(mail);
          await next();
        }
      ),
    ],target)
  }
}
