import { metadataCacheKey, restoreSnapshot, type MetadataIdentity,
  type MetadataSnapshot } from './metadataSnapshot';

export type MetadataStore = 'global' | 'object';
export type MetadataCacheEvent = 'IDB_UNAVAILABLE' | 'IDB_READ_FAILED' |
  'IDB_WRITE_FAILED' | 'CACHE_CORRUPT';

export interface MetadataCache {
  get(identity: MetadataIdentity, store: MetadataStore, objectName?: string): Promise<MetadataSnapshot | null>;
  put(identity: MetadataIdentity, store: MetadataStore, snapshot: MetadataSnapshot,
    objectName?: string): Promise<void>;
  clearMemory(): void;
  clearObjects(identity: MetadataIdentity): Promise<void>;
}

const databaseName = 'sfstudio-metadata-v1';

export class IndexedDbMetadataCache implements MetadataCache {
  private readonly memory = new Map<string, MetadataSnapshot>();
  private database: Promise<IDBDatabase> | null = null;
  private unavailable = false;

  constructor(private readonly idb: IDBFactory | undefined = globalThis.indexedDB,
    private readonly report: (event: MetadataCacheEvent) => void = () => {}) {}

  clearMemory(): void { this.memory.clear(); }

  async clearObjects(identity: MetadataIdentity): Promise<void> {
    const prefix = metadataCacheKey(identity);
    for (const key of this.memory.keys()) {
      if (!key.startsWith('object:')) continue;
      try {
        const parsed = JSON.parse(key.slice('object:'.length)) as [string, string];
        if (parsed[0] === prefix) this.memory.delete(key);
      } catch { /* Ignore unrelated malformed keys. */ }
    }
    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('object', 'readwrite');
        const request = tx.objectStore('object').openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          try {
            const parsed = JSON.parse(String(cursor.key)) as [string, string];
            if (parsed[0] === prefix) cursor.delete();
          } catch { /* Ignore unrelated malformed keys. */ }
          cursor.continue();
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } catch { this.report('IDB_WRITE_FAILED'); }
  }

  private key(identity: MetadataIdentity, objectName?: string): string {
    return JSON.stringify([metadataCacheKey(identity), objectName ?? null]);
  }

  private async open(): Promise<IDBDatabase> {
    if (!this.idb || this.unavailable) {
      if (!this.unavailable) this.report('IDB_UNAVAILABLE');
      this.unavailable = true;
      throw new Error('IndexedDB unavailable');
    }
    if (!this.database) {
      this.database = new Promise<IDBDatabase>((resolve, reject) => {
        let request: IDBOpenDBRequest;
        try { request = this.idb!.open(databaseName, 1); }
        catch (error) { reject(error); return; }
        request.onupgradeneeded = () => {
          const db = request.result;
          for (const store of ['global', 'object']) {
            if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('IndexedDB blocked'));
      }).catch(error => {
        this.unavailable = true;
        this.report('IDB_UNAVAILABLE');
        throw error;
      });
    }
    return this.database;
  }

  async get(identity: MetadataIdentity, store: MetadataStore,
    objectName?: string): Promise<MetadataSnapshot | null> {
    const key = this.key(identity, objectName);
    const memoryValue = this.memory.get(`${store}:${key}`);
    if (memoryValue) return memoryValue;
    try {
      const db = await this.open();
      const value = await new Promise<unknown>((resolve, reject) => {
        const request = db.transaction(store, 'readonly').objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (value === undefined) return null;
      const snapshot = restoreSnapshot(value, identity);
      if (!snapshot || (store === 'object' && !snapshot.objects[objectName ?? ''])) {
        this.report('CACHE_CORRUPT');
        return null;
      }
      this.memory.set(`${store}:${key}`, snapshot);
      return snapshot;
    } catch {
      this.report('IDB_READ_FAILED');
      return null;
    }
  }

  async put(identity: MetadataIdentity, store: MetadataStore,
    snapshot: MetadataSnapshot, objectName?: string): Promise<void> {
    const key = this.key(identity, objectName);
    if (!restoreSnapshot(snapshot, identity) ||
        (store === 'object' && !snapshot.objects[objectName ?? ''])) {
      throw new Error('Invalid metadata snapshot');
    }
    this.memory.set(`${store}:${key}`, snapshot);
    try {
      const db = await this.open();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(store, 'readwrite');
        transaction.objectStore(store).put(snapshot, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } catch {
      this.report('IDB_WRITE_FAILED');
    }
  }
}

export const metadataCache = new IndexedDbMetadataCache(undefined, event => {
  // Event codes contain no org identity, metadata, credentials or query results.
  console.warn(`metadata.cache.${event}`);
});
