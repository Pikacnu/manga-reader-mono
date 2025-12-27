'use client';

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
  const baseUrl =
    process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://localhost:3002';
  return `${baseUrl}/image?src=${src}?w=${width}&q=${quality || 75}`;
}
