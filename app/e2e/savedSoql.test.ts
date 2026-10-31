import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDbSavedSoqlRepository, savedSoqlRepository } from '../src/services/savedSoql/savedSoqlRepository';
import { listSavedSoql, loadSavedSoql, saveCurrentSoql } from '../src/core/savedSoqlActions';
import Proxy, { modelReader } from '../src/services/salesforceSchema/proxy';
import { CONTEXT_LEVEL, getCommands, getMenus, readCommand } from '../src/core/commandManager';
import applicationState from '../src/store/applicationState';
import dataState from '../src/store/dataState';
import modelState from '../src/store/modelState';
import savedSoqlState from '../src/store/savedSoqlState';
import sessionState from '../src/store/sessionState';
import viewState from '../src/store/viewState';

globalThis.structuredClone ??= <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const source = '00D000000000001:005000000000001';
const target = '00D000000000002:005000000000002';
const connection = (orgKey: string) => ({ orgKey, organizationId: orgKey.split(':')[0],
  userId: orgKey.split(':')[1], userName: 'fixture', alias: orgKey === source ? 'Integration' : 'UAT',
  instanceUrl: 'https://example.my.salesforce.com', loginHost: 'test.salesforce.com',
  environmentKind: 'SANDBOX' as const, status: 'CONNECTED' as const });
const queryState: QueryState = { indexCurrentElement: 0, queryElemnts: [{
  type: 'ROOT', parent: -1, level: 0, limit: 50,
  sObjectId: { orgSfName: source, sObjectApiName: 'Account', sObjectLocalId: 1 },
  selectClause: { fields: [{ fieldId: { fieldApiName: 'Id', fieldIndex: 0 },
    isAggregateFunction: false, makeGroupBy: false, soqlFunction: '%1' }] },
}] };

afterEach(() => jest.restoreAllMocks());

test('IndexedDB keeps one shared definition and preserves dates when it is updated', async () => {
  const idb = new IDBFactory();
  const first = new IndexedDbSavedSoqlRepository(idb);
  const query = { id: 'query-one', name: 'Accounts', createdDate: '2026-01-01T00:00:00.000Z',
    lastModifiedDate: '2026-01-01T00:00:00.000Z', body: 'SELECT Id FROM Account',
    createdOrgKey: source, availableOrgKeys: [source], formatVersion: 1 as const, queryState };
  await first.put(query);
  const reopened = new IndexedDbSavedSoqlRepository(idb);
  expect(await reopened.get(query.id)).toEqual(query);
  await reopened.put({ ...query, body: 'SELECT Id FROM Account LIMIT 50', availableOrgKeys: [source, target] });
  expect(await first.list()).toHaveLength(1);
  expect((await first.get(query.id))?.createdDate).toBe(query.createdDate);
  expect((await first.get(query.id))?.availableOrgKeys).toEqual([source, target]);
});

test('saving and loading in another org imports the same query and resolves local field indices', async () => {
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: source,
    connections: [connection(source), connection(target)] } });
  savedSoqlState.getState().clearCurrent();
  modelState.setState({ state: { ...modelState.getState().state, orgSfName: source },
    queryState, sqlState: { sql: 'SELECT Id FROM Account LIMIT 50', isValid: true } });
  const saved = await saveCurrentSoql('Shared accounts');
  expect(saved.createdOrgKey).toBe(source);
  expect(saved.availableOrgKeys).toEqual([source]);

  sessionState.setState({ publicSession: { version: 1, activeOrgKey: target,
    connections: [connection(source), connection(target)] } });
  jest.spyOn(Proxy, 'getSObjectsAdapter').mockResolvedValue([]);
  jest.spyOn(modelReader, 'getSObjectLocalIdbyName').mockReturnValue(7);
  jest.spyOn(Proxy, 'getFieldsAdapter').mockResolvedValue([{
    fieldApiName: 'Id', fieldLocalId: 3,
  } as GetFieldsIndex]);
  jest.spyOn(Proxy, 'getChildRelationships').mockReturnValue([]);
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({
    fields: [{ fieldLocalId: 3, name: 'Id' }],
  } as SObject);
  dataState.setState({ activeOrgKey: target });
  await loadSavedSoql(saved.id);

  const stored = await savedSoqlRepository.get(saved.id);
  expect(stored?.availableOrgKeys).toEqual([source, target]);
  expect(await listSavedSoql()).toHaveLength(1);
  expect(modelState.getState().queryState.queryElemnts[0].sObjectId).toEqual({
    orgSfName: target, sObjectApiName: 'Account', sObjectLocalId: 7,
  });
  expect(modelState.getState().queryState.queryElemnts[0].selectClause.fields[0].fieldId.fieldIndex).toBe(3);
  expect(savedSoqlState.getState().currentId).toBe(saved.id);
  expect(applicationState.getState().context_level).toBe(CONTEXT_LEVEL.OBJECT);
  expect(viewState.getState().currentView).toBe('sobject');
  expect(dataState.getState().sObjectFields[0].fieldLocalId).toBe(3);

  modelState.setState({ sqlState: { sql: 'SELECT Id FROM Account LIMIT 30', isValid: true } });
  const updated = await saveCurrentSoql('Shared accounts');
  expect(updated.id).toBe(saved.id);
  expect(updated.createdDate).toBe(saved.createdDate);
  expect(updated.body).toContain('LIMIT 30');
  expect(await listSavedSoql()).toHaveLength(1);
});

test('a missing target field leaves the current query and import list unchanged', async () => {
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: source,
    connections: [connection(source), connection(target)] } });
  savedSoqlState.getState().clearCurrent();
  modelState.setState({ state: { ...modelState.getState().state, orgSfName: source },
    queryState, sqlState: { sql: 'SELECT Id FROM Account LIMIT 50', isValid: true } });
  const saved = await saveCurrentSoql('Missing in target');
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: target,
    connections: [connection(source), connection(target)] } });
  jest.spyOn(Proxy, 'getSObjectsAdapter').mockResolvedValue([]);
  jest.spyOn(modelReader, 'getSObjectLocalIdbyName').mockReturnValue(7);
  jest.spyOn(Proxy, 'getFieldsAdapter').mockResolvedValue([]);
  const before = modelState.getState().queryState;
  await expect(loadSavedSoql(saved.id)).rejects.toThrow('El campo Account.Id no existe');
  expect(modelState.getState().queryState).toBe(before);
  expect((await savedSoqlRepository.get(saved.id))?.availableOrgKeys).toEqual([source]);
});

test('SOQL Management has menu and console parity without a toolbar button', () => {
  applicationState.getState().initializeApp();
  applicationState.getState().setContextLevel(CONTEXT_LEVEL.OBJECT);
  viewState.getState().setCurrentView('sobject');
  const command = readCommand('query management', CONTEXT_LEVEL.OBJECT)!;
  expect(command.actionId).toBe('query.management');
  expect(getMenus(CONTEXT_LEVEL.OBJECT).find(menu => menu.label === 'SOQL')?.options)
    .toContainEqual({ label: 'SOQL Management', command: 'query management' });
  expect(getCommands(CONTEXT_LEVEL.OBJECT)).not.toContain(command);
  applicationState.getState().exeCommandFromUI('query management');
  expect(applicationState.getState().commandConfirmed?.actionId).toBe(command.actionId);
  applicationState.getState().exeCommand('query management');
  expect(applicationState.getState().commandConfirmed?.actionId).toBe(command.actionId);
  applicationState.getState().commandConfirmed!.action({ model: modelState.getState(),
    view: viewState.getState(), application: applicationState.getState(), data: dataState.getState() });
  expect(applicationState.getState().context_level).toBe(CONTEXT_LEVEL.SQL_MANAGEMENT);
  expect(viewState.getState().currentView).toBe('SOQL_MANAGEMENT');
});
