import { MAX_RAM_CACHE_SIZE } from './config';

export class RAMCacher {
  private static instance: RAMCacher;
  private cache: Map<
    string,
    {
      data: Uint8Array;
      lastUsed: number;
    }
  >;
  private onCacheRemove?: (id: string, data: Uint8Array) => Promise<void>;

  public static getInstance(): RAMCacher {
    if (!RAMCacher.instance) {
      RAMCacher.instance = new RAMCacher();
    }
    return RAMCacher.instance;
  }

  constructor() {
    this.cache = new Map();
  }

  setOnCacheRemove(
    callback: (id: string, data: Uint8Array) => Promise<void>,
  ): void {
    this.onCacheRemove = callback;
  }

  get(id: string): Uint8Array | null {
    if (!this.cache.has(id)) return null;
    this.cache.get(id)!.lastUsed = Date.now();
    return this.cache.get(id)?.data || null;
  }

  set(id: string, data: Uint8Array): void {
    this.cache.set(id, { data, lastUsed: Date.now() });
    if (this.cache.size > MAX_RAM_CACHE_SIZE) {
      const sortedByLastUsed = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].lastUsed - b[1].lastUsed,
      );
      const itemsToDelete = sortedByLastUsed.slice(
        0,
        this.cache.size - MAX_RAM_CACHE_SIZE,
      );
      for (const [key] of itemsToDelete) {
        this.delete(key);
      }
    }
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }
  async delete(id: string): Promise<void> {
    if (!this.cache.has(id)) return; // 檢查快取中是否存在該項目
    try {
      const cacheData = this.cache.get(id);
      if (this.onCacheRemove && cacheData) {
        await this.onCacheRemove(id, cacheData.data);
      }
    } catch (error) {
      console.error(`Error during onCacheRemove for ID ${id}:`, error);
    } finally {
      this.cache.delete(id);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  async close(): Promise<void> {
    for (const id of this.cache.keys()) {
      await this.delete(id);
    }
  }
}
