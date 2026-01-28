//import { file } from 'bun';
import nodemailer from 'nodemailer';
import { BetterAuthURL, MailHost, MailPassword, MailUser } from './config';
import { join } from 'path';
import { readFile } from 'fs/promises';

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
});

export async function sendEmail(
  to: string,
  url: string,
  type: EmailType,
): Promise<void> {
  let personalizedContent = '';
  const emailDir = join(process.cwd(), 'src/email');

  const templateMap: Record<EmailType, string> = {
    [EmailType.SIGNUP]: 'login-verification.html',
    [EmailType.RESET_PASSWORD]: 'reset-password.html',
  };

  const templateFile = templateMap[type];
  if (!templateFile) {
    throw new Error('Unsupported email type');
  }

  const emailContent = await readFile(join(emailDir, templateFile), 'utf-8');

  personalizedContent = emailContent
    .replaceAll('{{action_url}}', url)
    .replaceAll('{{site_url}}', BetterAuthURL)
    .replaceAll('{{subject}}', subjectTypeMap[type]);

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
