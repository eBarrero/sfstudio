import { METADATA_SCHEMA_VERSION, metadataCacheKey, normalizeSnapshot,
  restoreSnapshot, type MetadataIdentity } from '../src/services/salesforceSchema/metadataSnapshot';

const identity: MetadataIdentity = {
  organizationId: '00D000000000001', userId: '005000000000001',
  orgKey: '00D000000000001:005000000000001', apiVersion: '61.0', locale: 'es-ES',
};

const account = {
  name: 'Account', label: 'Cuenta', labelPlural: 'Cuentas', keyPrefix: '001',
  custom: false, queryable: true, createable: true, updateable: true, deletable: true,
  fields: [
    { name: 'Name', label: 'Nombre', type: 'string', length: 255, precision: 0,
      scale: 0, nillable: false, custom: false, createable: true, updateable: true,
      unique: false, description: null, referenceTo: [], relationshipName: null,
      picklistValues: [] },
    { name: 'Id', label: 'ID', type: 'id', length: 18, precision: 0,
      scale: 0, nillable: false, custom: false, createable: false, updateable: false,
      unique: true, description: null, referenceTo: [], relationshipName: null,
      picklistValues: [] },
  ],
  childRelationships: [
    { childSObject: 'Contact', field: 'AccountId', relationshipName: 'Contacts',
      cascadeDelete: false, restrictedDelete: false },
  ],
} as unknown as Salesforce_SObject;

const contact = { ...account, name: 'Contact', label: 'Contacto', fields: [],
  childRelationships: [] } as Salesforce_SObject;

test('normalization is ordered, serializable and independent of Salesforce order', () => {
  const first = normalizeSnapshot(identity, [contact, account], 100, 200);
  const reversed = normalizeSnapshot(identity, [
    { ...account, fields: [...account.fields!].reverse() }, contact,
  ], 100, 200);
  expect(first).toEqual(reversed);
  expect(Object.keys(first.objects)).toEqual(['Account', 'Contact']);
  expect(Object.keys(first.objects.Account.fields!)).toEqual(['Id', 'Name']);
  expect(first.objects.Account.relationships!['Contact.AccountId'].relationshipName)
    .toBe('Contacts');
  expect(restoreSnapshot(JSON.parse(JSON.stringify(first)), identity)).toEqual(first);
});

test('identity and schema version isolate persisted snapshots', () => {
  const other = { ...identity, userId: '005000000000002',
    orgKey: '00D000000000001:005000000000002' };
  expect(metadataCacheKey(identity)).not.toBe(metadataCacheKey(other));
  expect(restoreSnapshot(normalizeSnapshot(identity, [account], 100, 200), other)).toBeNull();
  expect(restoreSnapshot({ ...normalizeSnapshot(identity, [account], 100, 200),
    schemaVersion: METADATA_SCHEMA_VERSION + 1 }, identity)).toBeNull();
});
