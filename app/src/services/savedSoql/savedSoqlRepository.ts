/** A saved definition is shared by every connection in which it has been opened. */
export interface SavedSoql {
  id: string;
  name: string;
  createdDate: string;
  lastModifiedDate: string;
  body: string;
  createdOrgKey: string;
  availableOrgKeys: string[];
  formatVersion: 4;
  queryState: QueryState;
}

export interface SavedSoqlRepository {
  list(): Promise<SavedSoql[]>;
  get(id: string): Promise<SavedSoql | null>;
  put(query: SavedSoql): Promise<void>;
}

const databaseName = 'sfstudio-saved-soql';

export class IndexedDbSavedSoqlRepository implements SavedSoqlRepository {
  private database: Promise<IDBDatabase> | null = null;

  constructor(private readonly idb: IDBFactory | undefined = globalThis.indexedDB) {}

  private open(): Promise<IDBDatabase> {
    if (!this.idb) return Promise.reject(new Error('IndexedDB no está disponible.'));
    if (!this.database) {
      this.database = new Promise<IDBDatabase>((resolve, reject) => {
        const request = this.idb!.open(databaseName, 1);
        request.onupgradeneeded = () => request.result.createObjectStore('queries', { keyPath: 'id' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('IndexedDB está bloqueado.'));
      }).catch(error => { this.database = null; throw error; });
    }
    return this.database;
  }

  async list(): Promise<SavedSoql[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction('queries', 'readonly').objectStore('queries').getAll();
      request.onsuccess = () => resolve((request.result as SavedSoql[])
        .filter(query => query.formatVersion === 4)
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)));
      request.onerror = () => reject(request.error);
    });
  }

  async get(id: string): Promise<SavedSoql | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction('queries', 'readonly').objectStore('queries').get(id);
      request.onsuccess = () => resolve(request.result?.formatVersion === 4 ? request.result as SavedSoql : null);
      request.onerror = () => reject(request.error);
    });
  }

  async put(query: SavedSoql): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('queries', 'readwrite');
      transaction.objectStore('queries').put(query);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
}

export const savedSoqlRepository = new IndexedDbSavedSoqlRepository();
