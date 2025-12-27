import { file, type BunFile } from 'bun';
import { UPLOADS_DIR, SHARED_SSD_CACHE_DIR } from './config';
import { exists, mkdir, rm, rename } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

export enum FileCacheType {
  ORIGINAL = 'original',
  PROCESSED = 'processed',
}

export type FileCacheEntry = {
  id: string;
  type: FileCacheType;
  filePath: string;
};

export type FileCollectionEntry = {
  id: string;
};
export type MetaData = Omit<FileCacheEntry, 'id' | 'collectionId' | 'filePath'>;

export class FileCacher {
  private static instance: FileCacher;
  private cache: Map<string, FileCacheEntry>;

  constructor() {
    this.cache = new Map<string, FileCacheEntry>();
    mkdir(UPLOADS_DIR, { recursive: true });
  }

  public static getInstance(): FileCacher {
    if (!FileCacher.instance) {
      FileCacher.instance = new FileCacher();
    }
    return FileCacher.instance;
  }

  public getCachePath(id: string, width: number, quality: number): string {
    const key = `${id}_w${width}_q${quality}`;
    const hash = createHash('md5').update(key).digest('hex');
    const dir1 = hash.substring(0, 2);
    const dir2 = hash.substring(2, 4);
    return join(SHARED_SSD_CACHE_DIR, dir1, dir2, `${id}_${hash}.webp`);
  }

  async setupData(cachedFiles: FileCacheEntry[]): Promise<void> {
    this.cache.clear();
    for (const file of cachedFiles) {
      this.cache.set(file.id, file);
    }
  }

  async saveFileToCache(
    id: string,
    data: Array<Uint8Array | File | BunFile>,
    metaData: FileCacheEntry,
  ): Promise<void> {
    const dirPath = join(UPLOADS_DIR);
    const filePath = join(dirPath, id);
    const tempFilePath = `${filePath}.tmp`;
    const fileData =
      data.length === 1 && data[0] instanceof Uint8Array
        ? data[0]
        : new Blob(data);
    await Bun.write(tempFilePath, fileData);
    await rename(tempFilePath, filePath);
    this.cache.set(id, { ...metaData, filePath });
  }

  async getFileFromCache(id: string): Promise<
    | (MetaData & {
        data: Uint8Array;
      })
    | null
  > {
    const entry = this.cache.get(id);
    if (!entry) return null;
    try {
      const fileData = await file(entry.filePath).bytes();
      return { ...entry, data: fileData };
    } catch (error) {
      console.error(`Error reading file ${entry.filePath} from cache:`, error);
      return null;
    }
  }

  async deleteFileFromCache(id: string): Promise<void> {
    const entry = this.cache.get(id);
    if (!entry) return;
    try {
      await file(entry.filePath).delete();
    } catch (error) {
      console.error(`Error deleting file ${entry.filePath} from cache:`, error);
    } finally {
      this.cache.delete(id);
    }
  }
}
