import { createLocalSignature } from './signature';

export const fetchWithSignature = async (
  url: string,
  options: RequestInit = {},
  signature?: { signature: string; timestamp: string },
): Promise<Response> => {
  const headers = new Headers(options.headers || {});
  if (!signature) {
    signature = createLocalSignature(options.body || '');
  }
  headers.set('X-Signature', signature.signature);
  headers.set('X-Timestamp', signature.timestamp);
  headers.set('User-Agent', 'MangaReaderBot/1.0');

  return fetch(url, {
    ...options,
    headers,
  });
};
