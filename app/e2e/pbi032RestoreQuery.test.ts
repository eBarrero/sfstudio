import 'fake-indexeddb/auto';
import { restoreQuery } from '../src/services/savedSoql/restoreQuery';
import Proxy, { modelReader } from '../src/services/salesforceSchema/proxy';
import { loadSavedSoql } from '../src/core/savedSoqlActions';
import { savedSoqlRepository } from '../src/services/savedSoql/savedSoqlRepository';
import modelState from '../src/store/modelState';
import sessionState from '../src/store/sessionState';
import savedSoqlState from '../src/store/savedSoqlState';

globalThis.structuredClone ??= <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const source = '00D000000000001:005000000000001';
const target = '00D000000000002:005000000000002';
const connection = (orgKey: string) => ({ orgKey, organizationId: orgKey.split(':')[0],
  userId: orgKey.split(':')[1], userName: 'fixture', alias: 'Fixture',
  instanceUrl: 'https://example.my.salesforce.com', loginHost: 'test.salesforce.com',
  environmentKind: 'SANDBOX' as const, status: 'CONNECTED' as const });
const select = { fieldId: { fieldApiName: 'Id', fieldIndex: 0 },
  isAggregateFunction: false, makeGroupBy: false, soqlFunction: '%1' };
function savedQuery(): QueryState {
  return { indexCurrentElement: 0, queryElemnts: [
    { type: 'ROOT', parent: -1, level: 0, limit: 50,
      sObjectId: { orgSfName: source, sObjectApiName: 'Contact', sObjectLocalId: 0 },
      selectClause: { fields: [select] }, whereLogic: 'C1 OR C2', where: [
        { field: { fieldApiName: 'LastName', fieldIndex: 1, relationshipPath: [] },
          operator: '=', value: "'Soto'", sqlString: "LastName = 'Soto'" },
        { field: { fieldApiName: 'Industry', fieldIndex: 2, relationshipPath: ['Account'] },
          operator: '=', value: "'Tech'", sqlString: "Account.Industry = 'Tech'" },
      ] },
    { type: 'RELETED', parent: 0, level: 1, path: 'Account.', relatedTo: 'Account',
      sObjectId: { orgSfName: source, sObjectApiName: 'Account', sObjectLocalId: 1 },
      selectClause: { fields: [] } },
  ] };
}

type Mode = 'valid' | 'missingRelation' | 'ambiguousRelation' | 'missingField';
function metadata(mode: Mode) {
  jest.spyOn(Proxy, 'getSObjectsAdapter').mockResolvedValue([]);
  jest.spyOn(modelReader, 'getSObjectLocalIdbyName').mockImplementation((_org, name) =>
    ({ Contact: 7, Account: 9 } as Record<string, number>)[name] ?? null);
  jest.spyOn(Proxy, 'getFieldsAdapter').mockImplementation(async (_org, objectId) => {
    if (objectId === 7) return [
      { fieldApiName: 'Id', fieldLocalId: 5 },
      { fieldApiName: 'LastName', fieldLocalId: 6 },
      ...(mode === 'missingRelation' ? [] : [{ fieldApiName: 'AccountId', fieldLocalId: 2,
        relationshipName: 'Account', type: 'reference' },
        ...(mode === 'ambiguousRelation' ? [{ fieldApiName: 'OtherAccountId', fieldLocalId: 3,
          relationshipName: 'Account', type: 'reference' }] : [])]),
    ] as GetFieldsIndex[];
    return [ { fieldApiName: 'Id', fieldLocalId: 8 },
      ...(mode === 'missingField' ? [] : [{ fieldApiName: 'Industry', fieldLocalId: 11 }])
    ] as GetFieldsIndex[];
  });
  jest.spyOn(modelReader, 'getField').mockReturnValue({ referenceTo: ['Account'] } as Fields);
}

afterEach(() => jest.restoreAllMocks());

test('restores qualified conditions using target metadata while retaining logic and source definition', async () => {
  metadata('valid');
  const sourceState = savedQuery();
  const restored = await restoreQuery(sourceState, target);
  expect(restored).not.toBe(sourceState);
  expect((restored.queryElemnts[0] as PrimaryQuery).whereLogic).toBe('C1 OR C2');
  expect((restored.queryElemnts[0] as PrimaryQuery).where?.map(item => item.field.fieldIndex)).toEqual([6, 11]);
  expect(restored.queryElemnts[0].selectClause.fields[0].fieldId.fieldIndex).toBe(5);
  expect(restored.queryElemnts[1].sObjectId.sObjectLocalId).toBe(9);
  expect((sourceState.queryElemnts[0] as PrimaryQuery).where?.[1].field.fieldIndex).toBe(2);
});

test('loads one saved related query into a compatible org without losing its WHERE logic', async () => {
  metadata('valid');
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({
    fields: [{ fieldLocalId: 5, name: 'Id' }, { fieldLocalId: 6, name: 'LastName' }],
  } as SObject);
  jest.spyOn(Proxy, 'getChildRelationships').mockReturnValue([]);
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: target,
    connections: [connection(source), connection(target)] } });
  const id = 'pbi032-compatible';
  savedSoqlState.getState().clearCurrent();
  await savedSoqlRepository.put({ id, name: 'Shared Contacts',
    createdDate: '2026-01-01T00:00:00.000Z', lastModifiedDate: '2026-01-01T00:00:00.000Z',
    body: "SELECT Id FROM Contact WHERE (LastName = 'Soto' OR Account.Industry = 'Tech') LIMIT 50",
    createdOrgKey: source, availableOrgKeys: [source], formatVersion: 3, queryState: savedQuery() });
  await loadSavedSoql(id);
  expect(modelState.getState().sqlState.sql).toContain(
    "WHERE (LastName = 'Soto' OR Account.Industry = 'Tech')");
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).whereLogic).toBe('C1 OR C2');
  expect((await savedSoqlRepository.get(id))?.availableOrgKeys).toEqual([source, target]);
  expect(savedSoqlState.getState().currentId).toBe(id);
});

test.each([
  ['missingRelation', 'La relación Account no existe o es ambigua'],
  ['ambiguousRelation', 'La relación Account no existe o es ambigua'],
  ['missingField', 'El campo Industry no existe'],
] as const)('rejects %s without changing query, context or imported org list', async (mode, message) => {
  metadata(mode);
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: target,
    connections: [connection(source), connection(target)] } });
  const id = `pbi032-${mode}`;
  await savedSoqlRepository.put({ id, name: id, createdDate: '2026-01-01T00:00:00.000Z',
    lastModifiedDate: '2026-01-01T00:00:00.000Z', body: 'SELECT Id FROM Contact',
    createdOrgKey: source, availableOrgKeys: [source], formatVersion: 3, queryState: savedQuery() });
  const before = modelState.getState().queryState;
  await expect(loadSavedSoql(id)).rejects.toThrow(message);
  expect(modelState.getState().queryState).toBe(before);
  expect((await savedSoqlRepository.get(id))?.availableOrgKeys).toEqual([source]);
});
