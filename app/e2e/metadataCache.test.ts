import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { IndexedDbMetadataCache } from '../src/services/salesforceSchema/metadataCache';
import { metadataCacheKey, normalizeSnapshot, type MetadataIdentity } from
  '../src/services/salesforceSchema/metadataSnapshot';

globalThis.structuredClone ??= <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const identity: MetadataIdentity = {
  organizationId: '00D000000000001', userId: '005000000000001',
  orgKey: '00D000000000001:005000000000001', apiVersion: '61.0', locale: 'es-ES',
};
const raw = {
  name: 'Account', label: 'Cuenta', labelPlural: 'Cuentas', keyPrefix: '001',
  custom: false, queryable: true, createable: true, updateable: true,
  deletable: true, fields: [], childRelationships: [],
} as unknown as Salesforce_SObject;
const snapshot = normalizeSnapshot(identity, [raw], 100, 200);

test('IndexedDB survives a new memory cache and isolates users', async () => {
  const idb = new IDBFactory();
  const first = new IndexedDbMetadataCache(idb);
  expect(await first.get(identity, 'global')).toBeNull();
  await first.put(identity, 'global', snapshot);
  await first.put(identity, 'object', snapshot, 'Account');
  const reopened = new IndexedDbMetadataCache(idb);
  expect(await reopened.get(identity, 'global')).toEqual(snapshot);
  expect(await reopened.get(identity, 'object', 'Account')).toEqual(snapshot);
  expect(await reopened.get({ ...identity, userId: '005000000000002',
    orgKey: '00D000000000001:005000000000002' }, 'global')).toBeNull();
  expect(JSON.stringify(snapshot)).not.toMatch(/accessToken|refreshToken|records/i);
});

test('corrupt entries become misses without breaking exploration', async () => {
  const idb = new IDBFactory();
  const cache = new IndexedDbMetadataCache(idb);
  await cache.put(identity, 'global', snapshot);
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = idb.open('sfstudio-metadata-v1', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const key = JSON.stringify([metadataCacheKey(identity), null]);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('global', 'readwrite');
    tx.objectStore('global').put({ schemaVersion: 999 }, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const events: string[] = [];
  const reopened = new IndexedDbMetadataCache(idb, event => events.push(event));
  expect(await reopened.get(identity, 'global')).toBeNull();
  expect(events).toEqual(['CACHE_CORRUPT']);
});

test('unavailable IndexedDB degrades to in-memory cache', async () => {
  const events: string[] = [];
  const cache = new IndexedDbMetadataCache(undefined, event => events.push(event));
  await cache.put(identity, 'global', snapshot);
  expect(await cache.get(identity, 'global')).toEqual(snapshot);
  expect(events).toContain('IDB_UNAVAILABLE');
});

test('normalization does not persist unexpected credentials or records', () => {
  const hostile = { ...raw, accessToken: 'forbidden', records: [{ Name: 'private' }],
    fields: [{ name: 'Secret__c', label: 'Secret', type: 'string',
      referenceTo: [], picklistValues: [], accessToken: 'forbidden' }] };
  const normalized = normalizeSnapshot(identity,
    [hostile as unknown as Salesforce_SObject], 100, 200);
  expect(JSON.stringify(normalized)).not.toMatch(/accessToken|forbidden|records|private/);
});

test('quota errors keep the L1 entry and emit a non-sensitive event', async () => {
  const events: string[] = [];
  const cache = new IndexedDbMetadataCache(new IDBFactory(), event => events.push(event));
  const put = jest.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
    throw new DOMException('quota', 'QuotaExceededError');
  });
  try {
    await cache.put(identity, 'global', snapshot);
    expect(await cache.get(identity, 'global')).toEqual(snapshot);
    expect(events).toContain('IDB_WRITE_FAILED');
  } finally { put.mockRestore(); }
});
