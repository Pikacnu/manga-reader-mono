export const PORT = Number(process.env.PORT) || 3000;
export const HOST = process.env.HOST || '0.0.0.0';
export const DB_URL =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.DB_PATH ||
  process.env.DB_CONNECTION_STRING ||
  './database.sqlite';
export const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
export const SHARED_SSD_CACHE_DIR =
  process.env.SHARED_SSD_CACHE_DIR || './cache';
export const CACHE_MAX_AGE =
  Number(process.env.CACHE_MAX_AGE) || 60 * 60 * 24 * 30;
export const MAX_UPLOAD_SIZE =
  Number(process.env.MAX_UPLOAD_SIZE) || 1024 * 1024 * 1024; // 1 GB
export const BACKTRACK_DURATION_IN_SECONDS =
  Number(process.env.BACKTRACK_DURATION_IN_SECONDS) || 2 * 24 * 60 * 60; // 2 days in seconds
export const RAM_CACHE_EXPIRY_DURATION =
  Number(process.env.RAM_CACHE_EXPIRY_DURATION) || 1 * 60 * 60; // 1 hour in seconds
export const MAX_RAM_CACHE_SIZE = Number(process.env.MAX_RAM_CACHE_SIZE) || 100; // Maximum number of images in RAM cache
export const MAX_SHARED_SSD_SIZE_GB =
  Number(process.env.MAX_SHARED_SSD_SIZE_GB) || 10; // 10 GB
export const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || 'any';
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || 'any';
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'test';
export const S3_VIRTUAL_HOSTED_STYLE =
  process.env.S3_VIRTUAL_HOSTED_STYLE !== undefined
    ? process.env.S3_VIRTUAL_HOSTED_STYLE === 'true' || false
    : false;
export const API_KEY = process.env.API_KEY || 'default_api_key';
