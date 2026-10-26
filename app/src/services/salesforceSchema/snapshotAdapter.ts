import type { MetadataIdentity, MetadataSnapshot, SnapshotObject } from './metadataSnapshot';
import { normalizeSnapshot } from './metadataSnapshot';
import { metadataCache } from './metadataCache';
import { getDescribe, getDescribeObject } from './controller';
import sessionState from '../../store/sessionState';

const API_VERSION = 'jsforce-default';
const TTL_MS = 24 * 60 * 60 * 1000;

export function identityForOrg(orgKey: string): MetadataIdentity {
  const connection = sessionState.getState().publicSession.connections
    .find(item => item.orgKey === orgKey);
  if (!connection) throw new Error('Organization is not part of the workspace');
  return { orgKey, organizationId: connection.organizationId, userId: connection.userId,
    apiVersion: API_VERSION, locale: navigator.language || 'es-ES' };
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
    const response = await getDescribe(orgKey);
    const now = Date.now();
    snapshot = normalizeSnapshot(identity, response.sobjects, now, now + TTL_MS);
    await metadataCache.put(identity, 'global', snapshot);
  }
  return Object.values(snapshot.objects).map(toLegacyObject);
}

export async function loadObject(orgKey: string, objectName: string): Promise<Salesforce_SObject> {
  const identity = identityForOrg(orgKey);
  let snapshot: MetadataSnapshot | null = await metadataCache.get(identity, 'object', objectName);
  if (!snapshot) {
    const response = await getDescribeObject(orgKey, objectName);
    if (response.name !== objectName) throw new Error('Unexpected object describe');
    const now = Date.now();
    snapshot = normalizeSnapshot(identity, [response], now, now + TTL_MS);
    await metadataCache.put(identity, 'object', snapshot, objectName);
  }
  return toLegacyObject(snapshot.objects[objectName]);
}
