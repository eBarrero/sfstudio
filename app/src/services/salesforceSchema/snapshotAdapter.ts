import type { MetadataIdentity, MetadataSnapshot, SnapshotObject } from './metadataSnapshot';
import { normalizeSnapshot } from './metadataSnapshot';
import { metadataCache } from './metadataCache';
import { getDescribe, getDescribeObject } from './controller';
import sessionState from '../../store/sessionState';

const TTL_MS = 24 * 60 * 60 * 1000;
export type MetadataFreshness = 'EMPTY' | 'FRESH' | 'STALE' | 'REFRESHING' | 'ERROR';
export interface MetadataStatus { state: MetadataFreshness; fetchedAt: number | null; }
const statuses = new Map<string, MetadataStatus>();
const objectStatuses = new Map<string, MetadataStatus>();
const emptyStatus: MetadataStatus = { state: 'EMPTY', fetchedAt: null };
const listeners = new Set<() => void>();
const pending = new Map<string, Promise<MetadataSnapshot>>();

export function subscribeMetadata(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function metadataStatus(orgKey: string): MetadataStatus {
  return statuses.get(orgKey) ?? emptyStatus;
}
const objectStatusKey = (orgKey: string, objectName: string) =>
  JSON.stringify([orgKey, objectName]);
export function metadataObjectStatus(orgKey: string, objectName: string): MetadataStatus {
  return objectStatuses.get(objectStatusKey(orgKey, objectName)) ?? emptyStatus;
}
function setObjectStatus(orgKey: string, objectName: string,
  state: MetadataFreshness, fetchedAt: number | null): void {
  const key = objectStatusKey(orgKey, objectName);
  const previous = objectStatuses.get(key);
  if (previous?.state === state && previous.fetchedAt === fetchedAt) return;
  objectStatuses.set(key, { state, fetchedAt });
  listeners.forEach(listener => listener());
}
function setStatus(orgKey: string, state: MetadataFreshness, fetchedAt: number | null): void {
  const previous = statuses.get(orgKey);
  if (previous?.state === state && previous.fetchedAt === fetchedAt) return;
  statuses.set(orgKey, { state, fetchedAt });
  listeners.forEach(listener => listener());
}

function fetchSnapshot(orgKey: string, objectName?: string): Promise<MetadataSnapshot> {
  const key = `${orgKey}:${objectName ?? ''}`;
  const existing = pending.get(key);
  if (existing) return existing;
  const identity = identityForOrg(orgKey);
  const request = (async () => {
    const response = objectName ? [await getDescribeObject(orgKey, objectName)] :
      (await getDescribe(orgKey)).sobjects;
    if (objectName && response[0]?.name !== objectName) throw new Error('Unexpected object describe');
    const now = Date.now();
    const snapshot = normalizeSnapshot(identity, response, now, now + TTL_MS);
    await metadataCache.put(identity, objectName ? 'object' : 'global', snapshot, objectName);
    if (!objectName) {
      await metadataCache.clearObjects(identity);
      for (const key of objectStatuses.keys()) {
        const parsed = JSON.parse(key) as [string, string];
        if (parsed[0] === orgKey) objectStatuses.delete(key);
      }
      listeners.forEach(listener => listener());
    }
    return snapshot;
  })();
  pending.set(key, request);
  void request.finally(() => pending.delete(key)).catch(() => {});
  return request;
}

export function identityForOrg(orgKey: string): MetadataIdentity {
  const workspace = sessionState.getState().publicSession;
  const connection = workspace.connections
    .find(item => item.orgKey === orgKey);
  if (!connection) throw new Error('Organization is not part of the workspace');
  return { orgKey, organizationId: connection.organizationId, userId: connection.userId,
    apiVersion: workspace.apiVersion ?? 'unknown', locale: navigator.language || 'es-ES' };
}

export function toLegacyObject(object: SnapshotObject): Salesforce_SObject {
  return {
    ...object.properties,
    name: object.name, label: object.label, labelPlural: object.labelPlural,
    keyPrefix: object.keyPrefix, custom: object.custom, queryable: object.queryable,
    createable: object.createable, updateable: object.updateable, deletable: object.deletable,
    fields: object.fields === null ? null : Object.values(object.fields).map(field => {
      const { properties, ...normalized } = field;
      return { ...properties, ...normalized };
    }) as unknown as Fields[],
    childRelationships: object.relationships === null ? null :
      Object.values(object.relationships).map(relationship => ({
        ...relationship, sObjectLocalId: -1,
      })) as unknown as ChildRelationships[],
  } as Salesforce_SObject;
}

export async function loadGlobal(orgKey: string): Promise<Salesforce_SObject[]> {
  const identity = identityForOrg(orgKey);
  let snapshot = await metadataCache.get(identity, 'global');
  if (!snapshot) {
    setStatus(orgKey, 'REFRESHING', null);
    try { snapshot = await fetchSnapshot(orgKey); }
    catch (error) { setStatus(orgKey, 'ERROR', null); throw error; }
  } else if (snapshot.expiresAt <= Date.now()) {
    setStatus(orgKey, 'STALE', snapshot.fetchedAt);
    void refreshGlobal(orgKey).catch(() => {});
    return Object.values(snapshot.objects).map(toLegacyObject);
  }
  setStatus(orgKey, 'FRESH', snapshot.fetchedAt);
  return Object.values(snapshot.objects).map(toLegacyObject);
}

export async function refreshGlobal(orgKey: string): Promise<Salesforce_SObject[]> {
  const identity = identityForOrg(orgKey);
  const previous = await metadataCache.get(identity, 'global');
  setStatus(orgKey, 'REFRESHING', previous?.fetchedAt ?? null);
  try {
    const snapshot = await fetchSnapshot(orgKey);
    setStatus(orgKey, 'FRESH', snapshot.fetchedAt);
    return Object.values(snapshot.objects).map(toLegacyObject);
  } catch (error) {
    setStatus(orgKey, 'ERROR', previous?.fetchedAt ?? null);
    throw error;
  }
}

export async function loadObject(orgKey: string, objectName: string): Promise<Salesforce_SObject> {
  const identity = identityForOrg(orgKey);
  let snapshot: MetadataSnapshot | null = await metadataCache.get(identity, 'object', objectName);
  if (!snapshot) {
    setObjectStatus(orgKey, objectName, 'REFRESHING', null);
    try { snapshot = await fetchSnapshot(orgKey, objectName); }
    catch (error) { setObjectStatus(orgKey, objectName, 'ERROR', null); throw error; }
  } else if (snapshot.expiresAt <= Date.now()) {
    setObjectStatus(orgKey, objectName, 'STALE', snapshot.fetchedAt);
    void refreshObject(orgKey, objectName).catch(() => {});
    return toLegacyObject(snapshot.objects[objectName]);
  }
  setObjectStatus(orgKey, objectName, 'FRESH', snapshot.fetchedAt);
  return toLegacyObject(snapshot.objects[objectName]);
}

async function refreshObject(orgKey: string, objectName: string): Promise<void> {
  const identity = identityForOrg(orgKey);
  const previous = await metadataCache.get(identity, 'object', objectName);
  setObjectStatus(orgKey, objectName, 'REFRESHING', previous?.fetchedAt ?? null);
  try {
    const snapshot = await fetchSnapshot(orgKey, objectName);
    setObjectStatus(orgKey, objectName, 'FRESH', snapshot.fetchedAt);
  } catch (error) {
    setObjectStatus(orgKey, objectName, 'ERROR', previous?.fetchedAt ?? null);
    throw error;
  }
}

export function freezeComparisonSnapshots(source: MetadataSnapshot,
  destination: MetadataSnapshot): readonly [MetadataSnapshot, MetadataSnapshot] {
  // Copies detach the comparison from cache refreshes and IndexedDB object lifetimes.
  const pair = structuredClone([source, destination]) as [MetadataSnapshot, MetadataSnapshot];
  function deepFreeze(value: object): void {
    Object.values(value).forEach(child => {
      if (child && typeof child === 'object' && !Object.isFrozen(child)) deepFreeze(child);
    });
    Object.freeze(value);
  }
  deepFreeze(pair);
  return pair;
}
