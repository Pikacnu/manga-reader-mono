export const imageServerURL = process.env.IMAGE_SERVER_URL || '';
export const imageServerURLInner =
  process.env.IMAGE_SERVER_URL_INNER || imageServerURL || '';
export const isWarpedImageServer = imageServerURL.length > 0;
export const IMAGE_SERVER_API_KEY =
  process.env.IMAGE_SERVER_API_KEY || 'default_image_server_key';
export const MailUser = process.env.MAIL_USER || 'default_mail_user';
export const MailPassword =
  process.env.MAIL_PASSWORD ||
  process.env.POSTFIX_PASSWORD ||
  'default_mail_password';
export const MailHost = process.env.MAIL_HOST || 'localhost';
export const BOT_SECRET = process.env.BOT_SECRET || 'default_bot_secret';
export const BetterAuthURL =
  process.env.BETTER_AUTH_URL || 'http://localhost:3000';
