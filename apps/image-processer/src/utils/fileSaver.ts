import { S3Client, type BunFile } from 'bun';
import {
  S3_ENDPOINT,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME,
} from './config';
import { join } from 'node:path';

export class FileSaver {
  private static instance: FileSaver;
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: S3_ENDPOINT,
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
      bucket: S3_BUCKET_NAME,

      // Required for SeaweedFS/Docker compatibility
      virtualHostedStyle: false,
    });
  }

  public static getInstance(): FileSaver {
    if (!FileSaver.instance) {
      FileSaver.instance = new FileSaver();
    }
    return FileSaver.instance;
  }

  async saveFileToDisk(id: string, data: BunFile): Promise<void> {
    await this.s3Client.write(join('/', id), data);
  }

  async getFileFromDisk(id: string): Promise<Uint8Array | null> {
    try {
      const file = this.s3Client.file(id);
      if (!file) return null;
      return await file.bytes();
    } catch (error) {
      console.error(`Error retrieving image ${id} from S3:`, error);
      return null;
    }
  }
}
