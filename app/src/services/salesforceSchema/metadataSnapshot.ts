/** JSON contract shared by the explorer, IndexedDB cache and future diff engine. */
export const METADATA_SCHEMA_VERSION = 1;

export interface MetadataIdentity {
  orgKey: string;
  organizationId: string;
  userId: string;
  apiVersion: string;
  locale: string;
}

export interface SnapshotField {
  properties: Record<string, unknown>;
  name: string;
  label: string;
  type: string;
  length: number;
  precision: number;
  scale: number;
  nillable: boolean;
  custom: boolean;
  createable: boolean;
  updateable: boolean;
  unique: boolean;
  description: string | null;
  referenceTo: string[];
  relationshipName: string | null;
  picklistValues: { value: string; label: string; active: boolean;
    defaultValue: boolean; validFor: string | null }[];
}

export interface SnapshotRelationship {
  key: string;
  childSObject: string;
  field: string;
  relationshipName: string | null;
  cascadeDelete: boolean;
  restrictedDelete: boolean;
}

export interface SnapshotObject {
  properties: Record<string, unknown>;
  name: string;
  label: string;
  labelPlural: string;
  keyPrefix: string | null;
  custom: boolean;
  queryable: boolean;
  createable: boolean;
  updateable: boolean;
  deletable: boolean;
  fields: Record<string, SnapshotField> | null;
  relationships: Record<string, SnapshotRelationship> | null;
}

export interface MetadataSnapshot extends MetadataIdentity {
  schemaVersion: typeof METADATA_SCHEMA_VERSION;
  fetchedAt: number;
  expiresAt: number;
  objects: Record<string, SnapshotObject>;
}

const byName = (left: string, right: string) => left.localeCompare(right, 'en');
const objectPropertyKeys = [
  'activateable', 'createable', 'custom', 'customSetting', 'deletable',
  'deprecatedAndHidden', 'feedEnabled', 'hasSubtypes', 'isSubtype', 'keyPrefix',
  'label', 'labelPlural', 'layoutable', 'mergeable', 'mruEnabled', 'name',
  'queryable', 'replicateable', 'retrieveable', 'searchable', 'triggerable',
  'undeletable', 'updateable',
] as const;
const fieldPropertyKeys = [
  'aggregatable', 'autoNumber', 'byteLength', 'calculated', 'calculatedFormula',
  'cascadeDelete', 'caseSensitive', 'compoundFieldName', 'controllerName',
  'createable', 'custom', 'defaultValue', 'defaultValueFormula',
  'defaultedOnCreate', 'dependentPicklist', 'deprecatedAndHidden', 'digits',
  'displayLocationInDecimal', 'encrypted', 'externalId', 'extraTypeInfo',
  'filterable', 'filteredLookupInfo', 'groupable', 'highScaleNumber',
  'htmlFormatted', 'idLookup', 'inlineHelpText', 'label', 'length', 'mask',
  'maskType', 'name', 'nameField', 'namePointing', 'nillable', 'permissionable',
  'polymorphicForeignKey', 'precision', 'queryByDistance',
  'referenceTargetField', 'relationshipName', 'relationshipOrder',
  'restrictedDelete', 'restrictedPicklist', 'scale', 'searchPrefilterable',
  'soapType', 'sortable', 'type', 'unique', 'updateable',
  'writeRequiresMasterRead', 'description',
] as const;

function selectProperties(value: object, keys: readonly string[]): Record<string, unknown> {
  const source = value as Record<string, unknown>;
  return Object.fromEntries(keys.filter(key => key in source).map(key => [key, source[key]]));
}

export function metadataCacheKey(identity: MetadataIdentity): string {
  if (identity.orgKey !== `${identity.organizationId}:${identity.userId}`) {
    throw new Error('Invalid metadata identity');
  }
  return JSON.stringify([
    METADATA_SCHEMA_VERSION, identity.organizationId, identity.userId,
    identity.apiVersion, identity.locale,
  ]);
}

export function normalizeObject(raw: Salesforce_SObject): SnapshotObject {
  const fields: Record<string, SnapshotField> | null = raw.fields == null ? null : {};
  for (const field of [...(raw.fields ?? [])].sort((a, b) => byName(a.name, b.name))) {
    fields![field.name] = {
      properties: selectProperties(field, fieldPropertyKeys),
      name: field.name, label: field.label, type: field.type,
      length: field.length, precision: field.precision, scale: field.scale,
      nillable: field.nillable, custom: field.custom, createable: field.createable,
      updateable: field.updateable, unique: field.unique,
      description: field.description ?? null,
      referenceTo: [...(field.referenceTo ?? [])].sort(byName),
      relationshipName: field.relationshipName ?? null,
      picklistValues: [...(field.picklistValues ?? [])]
        .map(value => ({ value: value.value, label: value.label,
          active: value.active, defaultValue: value.defaultValue,
          validFor: value.validFor ?? null }))
        .sort((a, b) => byName(a.value, b.value)),
    };
  }

  const relationships: Record<string, SnapshotRelationship> | null =
    raw.childRelationships == null ? null : {};
  for (const relationship of [...(raw.childRelationships ?? [])]
    .sort((a, b) => byName(`${a.childSObject}.${a.field}`, `${b.childSObject}.${b.field}`))) {
    const key = `${relationship.childSObject}.${relationship.field}`;
    relationships![key] = {
      key, childSObject: relationship.childSObject, field: relationship.field,
      relationshipName: relationship.relationshipName ?? null,
      cascadeDelete: relationship.cascadeDelete,
      restrictedDelete: relationship.restrictedDelete,
    };
  }
  return {
    properties: selectProperties(raw, objectPropertyKeys),
    name: raw.name, label: raw.label, labelPlural: raw.labelPlural,
    keyPrefix: raw.keyPrefix, custom: raw.custom, queryable: raw.queryable,
    createable: raw.createable, updateable: raw.updateable, deletable: raw.deletable,
    fields, relationships,
  };
}

export function normalizeSnapshot(
  identity: MetadataIdentity, objects: Salesforce_SObject[], fetchedAt: number,
  expiresAt: number,
): MetadataSnapshot {
  metadataCacheKey(identity);
  const normalized: Record<string, SnapshotObject> = {};
  for (const object of [...objects].sort((a, b) => byName(a.name, b.name))) {
    normalized[object.name] = normalizeObject(object);
  }
  return { ...identity, schemaVersion: METADATA_SCHEMA_VERSION,
    fetchedAt, expiresAt, objects: normalized };
}

export function restoreSnapshot(value: unknown, identity: MetadataIdentity): MetadataSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Partial<MetadataSnapshot>;
  if (snapshot.schemaVersion !== METADATA_SCHEMA_VERSION ||
      snapshot.orgKey !== identity.orgKey ||
      snapshot.organizationId !== identity.organizationId ||
      snapshot.userId !== identity.userId ||
      snapshot.apiVersion !== identity.apiVersion ||
      snapshot.locale !== identity.locale ||
      typeof snapshot.fetchedAt !== 'number' ||
      typeof snapshot.expiresAt !== 'number' ||
      !snapshot.objects || typeof snapshot.objects !== 'object' ||
      Array.isArray(snapshot.objects)) return null;
  for (const [key, object] of Object.entries(snapshot.objects)) {
    if (!object || object.name !== key || typeof object.label !== 'string' ||
        (object.fields !== null && typeof object.fields !== 'object') ||
        (object.relationships !== null && typeof object.relationships !== 'object')) return null;
  }
  return snapshot as MetadataSnapshot;
}
