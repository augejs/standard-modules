import nodemailer from 'nodemailer';
import { Metadata, ScanNode, ScanHook } from '@augejs/core';
import OriginalMail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

interface Mail extends OriginalMail {
  createTransport: typeof nodemailer.createTransport
}

export {
  Mail
}

// https://nodemailer.com/about/

export const ConfigName = 'mail';

export const MAIL_IDENTIFIER = Symbol.for(ConfigName);

export function MailTransport(opts?: SMTPTransport.Options): ClassDecorator {
  return function(target: NewableFunction) {
    Metadata.decorate([
      ScanHook(
        async (scanNode: ScanNode, next: CallableFunction) => {
          const rootConfig: SMTPTransport.Options = scanNode.context.rootScanNode?.getConfig(ConfigName);
          const nodeConfig: SMTPTransport.Options = scanNode.getConfig(ConfigName);

          const defaultOpts = {
            ...rootConfig,
            ...nodeConfig,
            ...opts
          };

          const mail = nodemailer.createTransport(defaultOpts) as Mail;
          mail.createTransport = nodemailer.createTransport.bind(nodemailer);

          scanNode.context.container.bind(MAIL_IDENTIFIER).toConstantValue(mail);
          await next();
        }
      ),
    ],target)
  }
}
