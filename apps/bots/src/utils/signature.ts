import crypto from 'crypto';
import { SecretKey } from './config';
import type { BodyInit } from 'bun';

export const createSignature = (payload: BodyInit, secret: string) => {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signature = crypto
    .createHmac('sha256', secret)
    .update(normalizeBody(payload))
    .update(timestamp)
    .digest('hex');
  return { signature: signature, timestamp };
};

export const createLocalSignature = (payload: BodyInit) => {
  return createSignature(payload, SecretKey);
};

function normalizeBody(body?: BodyInit): Buffer {
  if (!body) return Buffer.alloc(0);
  if (typeof body === 'string') return Buffer.from(body);
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (ArrayBuffer.isView(body))
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);

  throw new Error('Unsupported body type');
}
