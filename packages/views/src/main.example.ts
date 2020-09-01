import { Module, Logger, ILogger, Inject, boot } from '@augejs/module-core';
import Mail from 'nodemailer/lib/mailer';
import { MAIL_TOKEN, MailTransport } from './main';

const logger:ILogger = Logger.getLogger('app');

@MailTransport({
  host: "smtp.163.com",
  port: 25,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'alex_20190502@163.com', // generated ethereal user
    pass: 'IBXLIAHJVGYEXINB', // generated ethereal password
  },
})
@Module()
class AppModule {

  @Inject(MAIL_TOKEN)
  mail!: Mail;

  async onInit() {
    logger.info('app onInit');
  }

  async onAppDidReady () {
    logger.info('app onAppDidReady');

    const results = await this.mail.sendMail({
      from: '"Fred Foo 👻" <alex_20190502@163.com', // sender address
      to: "gzane24@hotmail.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // html body
    });

    logger.info(results);
  }
}

async function main() {
  await boot(AppModule);
}

main();

