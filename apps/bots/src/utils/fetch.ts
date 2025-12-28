import { createLocalSignature } from './signature';

export const fetchWithSignature = async (
  url: string,
  options: RequestInit = {},
  signature?: { signature: string; timestamp: string },
) => {
  const headers = new Headers(options.headers || {});
  if (!signature) {
    signature = createLocalSignature(options.body || '');
  }
  headers.set('X-Signature', signature.signature);
  headers.set('X-Timestamp', signature.timestamp);

  const response = await fetch(url, {
    ...options,
    headers,
  });
  return response;
};
