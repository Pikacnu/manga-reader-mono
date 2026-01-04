import { file, Glob } from 'bun';
import {
  UPLOADS_DIR,
  SHARED_SSD_CACHE_DIR,
  MAX_SHARED_SSD_SIZE_GB,
} from './config';
import { mkdir, rmdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import db from './db';
import { ImageIdLink } from '../../db/schema';
import { asc } from 'drizzle-orm';

export class FileCacher {
  private static instance: FileCacher;

  constructor() {
    mkdir(UPLOADS_DIR, { recursive: true });
    mkdir(SHARED_SSD_CACHE_DIR, { recursive: true });
  }

  public static getInstance(): FileCacher {
    if (!FileCacher.instance) {
      FileCacher.instance = new FileCacher();
    }
    return FileCacher.instance;
  }

  /**
   * 取得處理後圖片 (WebP) 在 SSD 快取中的路徑
   */
  public getProcessedCachePath(
    id: string,
    width: number,
    quality: number,
  ): string {
    const key = `${id}_w${width}_q${quality}`;
    const hash = createHash('md5').update(key).digest('hex');
    const dir1 = hash.substring(0, 2);
    const dir2 = hash.substring(2, 4);
    return join(SHARED_SSD_CACHE_DIR, dir1, dir2, `${id}_${hash}.webp`);
  }

  /**
   * 刪除暫存的上傳檔案 (位於 UPLOADS_DIR)，並嘗試清理空的父目錄
   * 用於檔案已成功上傳至 S3 後的清理
   */
  async deleteTempUpload(filePath: string): Promise<void> {
    try {
      const f = file(filePath);
      if (await f.exists()) {
        await f.delete();
        // console.log(`Deleted temp file: ${filePath}`);
      }

      // 嘗試刪除父目錄 (upload.ts 會為每個請求建立一個資料夾)
      // 只有當目錄為空時 rmdir 才會成功，這正是我們想要的
      const dir = dirname(filePath);
      if (dir.startsWith(UPLOADS_DIR) && dir !== UPLOADS_DIR) {
        try {
          await rmdir(dir);
          // console.log(`Deleted empty temp dir: ${dir}`);
        } catch (e) {
          // 目錄不為空或其他錯誤，忽略
        }
      }
    } catch (error) {
      console.error(`Error deleting temp file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * 刪除所有與該 ID 相關的處理後快取檔案 (WebP)，並返回刪除的總位元組數
   */
  async deleteProcessedCache(id: string): Promise<number> {
    let deletedSize = 0;
    const glob = new Glob(`**/${id}_*.webp`);
    for await (const relativePath of glob.scan(SHARED_SSD_CACHE_DIR)) {
      const absolutePath = join(SHARED_SSD_CACHE_DIR, relativePath);
      try {
        const s = await stat(absolutePath);
        await file(absolutePath).delete();
        deletedSize += s.size;
        console.log(
          `Deleted processed cache: ${absolutePath} (${s.size} bytes)`,
        );
      } catch (e) {
        console.error(`Error deleting processed cache ${absolutePath}:`, e);
      }
    }
    return deletedSize;
  }

  /**
   * 刪除原始快取檔案 (originals/{id})，並返回刪除的位元組數
   */
  async deleteOriginalCache(id: string): Promise<number> {
    const originalPath = join(SHARED_SSD_CACHE_DIR, 'originals', id);
    try {
      const f = file(originalPath);
      if (await f.exists()) {
        const s = await stat(originalPath);
        await f.delete();
        console.log(
          `Deleted original cache: ${originalPath} (${s.size} bytes)`,
        );
        return s.size;
      }
    } catch (e) {
      console.error(`Error deleting original cache ${originalPath}:`, e);
    }
    return 0;
  }

  /**
   * 檢查 SSD 快取容量，若超過上限則清理
   */
  async checkAndCleanupSSD(): Promise<void> {
    try {
      let totalSize = 0;
      const glob = new Glob('**/*');

      for await (const relativePath of glob.scan(SHARED_SSD_CACHE_DIR)) {
        const absolutePath = join(SHARED_SSD_CACHE_DIR, relativePath);
        try {
          const s = await stat(absolutePath);
          totalSize += s.size;
        } catch (e) {}
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

          const freedProcessed = await this.deleteProcessedCache(img.id);
          const freedOriginal = await this.deleteOriginalCache(img.id);

          totalSize -= freedProcessed + freedOriginal;
        }
      }
    } catch (err) {
      console.error('Error during SSD cleanup:', err);
    }
  }
}
