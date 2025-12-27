import { file } from 'bun';
import sharp from 'sharp';
import { CACHE_MAX_AGE, SHARED_SSD_CACHE_DIR } from '../utils/config';
import db from '../utils/db';
import { ImageIdLink } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { RAMCacher } from '../utils/ramCacher';
import { FileSaver } from '../utils/fileSaver';
import { FileCacher } from '../utils/fileCacher';
import type { MiniifyOptmizeType, WithSrc } from '../utils/type';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { src, w, q } = Object.fromEntries(
    url.searchParams,
  ) as unknown as Partial<WithSrc<MiniifyOptmizeType>>;
  const width = w ? Number(w) : 640;
  const quality = q ? Number(q) : 75;

  const ImageCacherInstance = RAMCacher.getInstance();
  const fileSaverInstance = FileSaver.getInstance();
  const fileCacherInstance = FileCacher.getInstance();

  // L1: RAM Cache
  const ramCacheKey = `${src}_w${width}_q${quality}`;
  if (ImageCacherInstance.has(ramCacheKey)) {
    const cachedImageData = ImageCacherInstance.get(ramCacheKey);
    if (cachedImageData) {
      return new Response(cachedImageData, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        },
        status: 200,
      });
    }
  }

  // L3: Shared SSD Cache
  const cachePath = fileCacherInstance.getCachePath(
    String(src),
    width,
    quality,
  );
  const cacheFile = file(cachePath);
  if (await cacheFile.exists()) {
    const cacheData = await cacheFile.bytes();
    ImageCacherInstance.set(ramCacheKey, cacheData);

    // Update last used date in DB
    await db
      .update(ImageIdLink)
      .set({ lastUsedDate: new Date() })
      .where(eq(ImageIdLink.id, String(src)));

    return new Response(cacheData, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
      },
      status: 200,
    });
  }

  // L4: Original Source (Local or S3)
  const fileData = (
    await db
      .select({
        id: ImageIdLink.id,
        isSaved: ImageIdLink.isSaved,
        filePath: ImageIdLink.filePath,
      })
      .from(ImageIdLink)
      .where(eq(ImageIdLink.id, String(src)))
  )[0];

  if (!fileData) {
    return new Response('Image not found', { status: 404 });
  }

  let originalData: Uint8Array | null = null;

  if (!originalData) {
    const originalCachePath = join(
      SHARED_SSD_CACHE_DIR,
      'originals',
      String(src),
    );
    const originalCacheFile = file(originalCachePath);

    if (await originalCacheFile.exists()) {
      originalData = await originalCacheFile.bytes();
    } else if (fileData.isSaved === 1) {
      originalData = await fileSaverInstance.getFileFromDisk(fileData.id);
      if (originalData) {
        // Cache the original on Shared SSD for other sizes/Pods
        await mkdir(dirname(originalCachePath), { recursive: true });
        await originalCacheFile.write(originalData);
      }
    } else {
      try {
        originalData = await file(fileData.filePath).bytes();
        // Optionally cache local files to Shared SSD too if UPLOADS_DIR is not shared
        if (
          originalData &&
          !fileData.filePath.startsWith(SHARED_SSD_CACHE_DIR)
        ) {
          await mkdir(dirname(originalCachePath), { recursive: true });
          await originalCacheFile.write(originalData);
        }
      } catch (e) {
        console.error(`Error reading local file ${fileData.filePath}:`, e);
      }
    }
  }

  if (!originalData) {
    return new Response('Original image not found', { status: 404 });
  }

  // Process with Sharp
  try {
    const processedBuffer = await sharp(originalData)
      .resize(width)
      .webp({ quality })
      .toBuffer();

    // Save to L3 (Shared SSD)
    await mkdir(dirname(cachePath), { recursive: true });
    await file(cachePath).write(processedBuffer);

    // Save to L1 (RAM)
    ImageCacherInstance.set(ramCacheKey, processedBuffer);

    // Update last used date
    await db
      .update(ImageIdLink)
      .set({ lastUsedDate: new Date() })
      .where(eq(ImageIdLink.id, String(src)));

    return new Response(processedBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
      },
      status: 200,
    });
  } catch (error) {
    console.error(`Error processing image ${src}:`, error);
    return new Response('Error processing image', { status: 500 });
  }
}

export default {
  GET,
};
