import { file, serve, Glob } from 'bun';
import {
  PORT,
  HOST,
  UPLOADS_DIR,
  BACKTRACK_DURATION_IN_SECONDS,
  SHARED_SSD_CACHE_DIR,
  MAX_SHARED_SSD_SIZE_GB,
  RAM_CACHE_EXPIRY_DURATION,
  SHARED_SSD_CACHE_DURATION_IN_SECONDS,
} from './src/utils/config';
import ImageHandler from './src/api/image';
import UploadHandler from './src/api/upload';
import { mkdir, stat, unlink } from 'fs/promises';
import db from './src/utils/db';
import { ImageIdLink } from './db/schema';
import { lte, and, eq, asc } from 'drizzle-orm';
import { RAMCacher } from './src/utils/ramCacher';
import { FileSaver } from './src/utils/fileSaver';
import { FileCacher } from './src/utils/fileCacher';
import { join } from 'path';

console.log('Creating uploads directory if it does not exist...');
await mkdir(UPLOADS_DIR, { recursive: true });
//await mkdir(BACKUP_MOUNT_DIR, { recursive: true });
await mkdir(SHARED_SSD_CACHE_DIR, { recursive: true });

// Initialize singletons
const fileSaverInstance = FileSaver.getInstance();
const ramCacherInstance = RAMCacher.getInstance();
const fileCacherInstance = FileCacher.getInstance();

const server = serve({
  port: PORT,
  hostname: HOST,
  idleTimeout: 120,
  maxRequestBodySize: Math.pow(1024, 3), // 1 GB
  routes: {
    '/': {
      GET() {
        return new Response('Image Processor API is running.', {
          status: 200,
        });
      },
    },
    '/image': ImageHandler,
    '/upload': UploadHandler,
    '/list': {
      GET: async (request) => {
        return Response.json({
          images: await db
            .select({ id: ImageIdLink.id, filePath: ImageIdLink.filePath })
            .from(ImageIdLink),
        });
      },
    },
  },

  // async fetch(request) {
  //   const url = new URL(request.url);
  //   const path = url.pathname;
  //   return Response.json({ message: 'Not Found' }, { status: 404 });
  // },
});

console.log(`Server running at http://${server.hostname}:${server.port}/`);

ramCacherInstance.setOnCacheRemove(async (id: string, data: Uint8Array) => {
  await db
    .update(ImageIdLink)
    .set({
      lastUsedDate: new Date(),
    })
    .where(eq(ImageIdLink.id, String(id)));
});

const saveCheckInterval = setInterval(async () => {
  try {
    const filesThatNeedsSaving = await db
      .select({
        id: ImageIdLink.id,
        filePath: ImageIdLink.filePath,
      })
      .from(ImageIdLink)
      .where(
        and(
          lte(
            ImageIdLink.lastUsedDate,
            new Date(Date.now() - BACKTRACK_DURATION_IN_SECONDS * 1000),
          ),
          eq(ImageIdLink.isSaved, 0),
          eq(ImageIdLink.isProcessing, 0),
        ),
      );

    for (const fileRecord of filesThatNeedsSaving) {
      if (ramCacherInstance.has(fileRecord.id)) continue;

      // Try to claim the file for processing
      const claimResult = await db
        .update(ImageIdLink)
        .set({ isProcessing: 1 })
        .where(
          and(
            eq(ImageIdLink.id, fileRecord.id),
            eq(ImageIdLink.isSaved, 0),
            eq(ImageIdLink.isProcessing, 0),
          ),
        )
        .returning();

      if (claimResult.length === 0) {
        // Someone else claimed it
        continue;
      }

      try {
        await fileSaverInstance.saveFileToDisk(
          fileRecord.id,
          file(fileRecord.filePath),
        );

        // Update database record
        await db
          .update(ImageIdLink)
          .set({ isSaved: 1, isProcessing: 0 })
          .where(eq(ImageIdLink.id, fileRecord.id));

        // Delete local file
        try {
          await fileCacherInstance.deleteTempUpload(fileRecord.filePath);
        } catch (e) {
          console.error(
            `Error deleting file from cache for ID ${fileRecord.id}:`,
            e,
          );
        }
        console.log(
          `File ${fileRecord.filePath} with ID ${fileRecord.id} marked as saved.`,
        );
      } catch (fileError) {
        console.error(`Error saving file ${fileRecord.filePath}:`, fileError);
        // Reset processing status on error
        await db
          .update(ImageIdLink)
          .set({ isProcessing: 0 })
          .where(eq(ImageIdLink.id, fileRecord.id));
      }
    }
  } catch (err) {
    console.error('Error during saveCheckInterval:', err);
  }
}, 60 * 1000);

const ramCacheCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, value] of ramCacherInstance['cache']) {
    if (now - value.lastUsed > BACKTRACK_DURATION_IN_SECONDS * 1000) {
      ramCacherInstance.delete(id);
      console.log(
        `Image with ID ${id} removed from RAM cache due to inactivity.`,
      );
    }
  }
}, RAM_CACHE_EXPIRY_DURATION * 1000);

const sharedSSDCleanupInterval = setInterval(async () => {
  try {
    let totalSize = 0;
    const glob = new Glob('**/*'); // Scan all files in cache dir
    const files: { path: string; size: number }[] = [];

    for await (const relativePath of glob.scan(SHARED_SSD_CACHE_DIR)) {
      const absolutePath = join(SHARED_SSD_CACHE_DIR, relativePath);
      const s = await stat(absolutePath);
      totalSize += s.size;
      files.push({ path: absolutePath, size: s.size });
    }

    const thresholdBytes = MAX_SHARED_SSD_SIZE_GB * 1024 * 1024 * 1024;
    if (totalSize > thresholdBytes) {
      console.log(
        `Shared SSD cache size (${(totalSize / 1024 / 1024 / 1024).toFixed(
          2,
        )} GB) exceeds threshold. Cleaning up...`,
      );

      // Query DB for oldest images
      const oldestImages = await db
        .select({ id: ImageIdLink.id })
        .from(ImageIdLink)
        .orderBy(asc(ImageIdLink.lastUsedDate));

      for (const img of oldestImages) {
        if (totalSize <= thresholdBytes * 0.8) break; // Clean until 80% full

        // 使用 FileCacher 統一處理刪除邏輯
        const freedProcessed = await fileCacherInstance.deleteProcessedCache(
          img.id,
        );
        const freedOriginal = await fileCacherInstance.deleteOriginalCache(
          img.id,
        );

        totalSize -= freedProcessed + freedOriginal;
      }
    }
  } catch (err) {
    console.error('Error during sharedSSDCleanupInterval:', err);
  }
}, SHARED_SSD_CACHE_DURATION_IN_SECONDS * 1000);

process.on('SIGINT', async () => {
  console.log('Gracefully shutting down...');
  clearInterval(saveCheckInterval);
  clearInterval(ramCacheCleanupInterval);
  clearInterval(sharedSSDCleanupInterval);
  server.stop();

  try {
    // 等待所有異步操作完成
    await Promise.all([ramCacherInstance.close()]);
    console.log('All asynchronous operations completed.');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  console.log('Server stopped.');
  process.exit();
});
