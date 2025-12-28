import crypto from 'crypto';
import { SecretKey } from './config';

export const createSignature = (payload: BodyInit, secret: string) => {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload + timestamp)
    .digest('hex');
  return { signature: signature, timestamp };
};

export const createLocalSignature = (payload: BodyInit) => {
  return createSignature(payload, SecretKey);
};
