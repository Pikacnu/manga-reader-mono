import { file } from 'bun';
import nodemailer from 'nodemailer';
import { MailHost, MailPassword, MailUser } from './config';
import { join } from 'path';

export enum EmailType {
  SIGNUP = 'SIGNUP',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

const subjectTypeMap: Record<EmailType, string> = {
  [EmailType.SIGNUP]: 'Verify your email address',
  [EmailType.RESET_PASSWORD]: 'Reset your password',
};

const mailer = nodemailer.createTransport({
  host: MailHost,
  port: 465,
  secure: true,
  auth: {
    user: MailUser,
    pass: MailPassword,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const currentPath = import.meta.dir;

export async function sendEmail(
  to: string,
  url: string,
  type: EmailType,
): Promise<void> {
  let personalizedContent = '';
  switch (type) {
    case EmailType.SIGNUP: {
      const emailContent = await file(
        join(currentPath, '../email/login-verification.html'),
      ).text();
      personalizedContent = emailContent
        .replace('{{verification_link}}', url)
        .replace('{{subject}}', subjectTypeMap[type]);

      break;
    }
    case EmailType.RESET_PASSWORD: {
      const emailContent = await file(
        join(currentPath, '../email/reset-password.html'),
      ).text();
      personalizedContent = emailContent
        .replace('{{reset_link}}', url)
        .replace('{{subject}}', subjectTypeMap[type]);
      break;
    }

    default:
      throw new Error('Unsupported email type');
  }
  if (!personalizedContent) {
    throw new Error('Email content is empty');
  }
  await mailer.sendMail({
    from: `Manga Reader <${MailUser}>`,
    to,
    subject: subjectTypeMap[type],
    html: personalizedContent,
  });
}
