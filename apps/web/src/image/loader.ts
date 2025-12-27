'use client';

import { imageServerURL } from '../utils/config';

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (
    src.startsWith('http') ||
    src.startsWith('data:') ||
    src.startsWith('/')
  ) {
    return src;
  }
  const baseUrl = imageServerURL || 'http://localhost:3001';
  return `${baseUrl}/image?src=${src}&w=${width}&q=${quality || 75}`;
}
