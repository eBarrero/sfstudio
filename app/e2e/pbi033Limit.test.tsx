import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import WhereClausePanel from '../src/components/organisms/sObjectPanel/whereClausePanel';
import { CONTEXT_LEVEL, readCommand } from '../src/core/commandManager';
import { saveCurrentSoql, loadSavedSoql } from '../src/core/savedSoqlActions';
import { savedSoqlRepository } from '../src/services/savedSoql/savedSoqlRepository';
import Proxy, { modelReader } from '../src/services/salesforceSchema/proxy';
import { apiClient } from '../src/services/http/apiClient';
import applicationState from '../src/store/applicationState';
import dataState from '../src/store/dataState';
import modelState from '../src/store/modelState';
import savedSoqlState from '../src/store/savedSoqlState';
import sessionState from '../src/store/sessionState';
import sqlExecutionState from '../src/store/sqlExecutionState';
import viewState from '../src/store/viewState';

globalThis.structuredClone ??= function cloneForTest<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
};

const orgKey = '00D000000000001:005000000000001';
const connection = { orgKey, organizationId: '00D000000000001', userId: '005000000000001',
  userName: 'fixture', alias: 'Integration', instanceUrl: 'https://example.my.salesforce.com',
  loginHost: 'test.salesforce.com', environmentKind: 'SANDBOX' as const, status: 'CONNECTED' as const };
const selected = { fieldId: { fieldApiName: 'Id', fieldIndex: 0 },
  isAggregateFunction: false, makeGroupBy: false, soqlFunction: '%1' };
function query(): QueryState {
  return { indexCurrentElement: 0, queryElemnts: [
    { type: 'ROOT', parent: -1, level: 0, limit: 50,
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Account', sObjectLocalId: 0 },
      selectClause: { fields: [selected] } },
    { type: 'RELETED', parent: 0, level: 1, path: 'Owner.', relatedTo: 'Owner',
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'User', sObjectLocalId: 1 },
      selectClause: { fields: [] } },
    { type: 'SUBQUERY', parent: 0, level: 1, limit: 1, relationshipName: 'Contacts',
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Contact', sObjectLocalId: 2 },
      selectClause: { fields: [selected] } },
  ] };
}
function setup() {
  const queryState = query();
  modelState.setState({ queryState, state: { ...modelState.getState().state, orgSfName: orgKey },
    sqlState: { sql: 'SELECT Id, (SELECT Id FROM Contacts LIMIT 1) FROM Account LIMIT 50', isValid: true } });
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: orgKey, connections: [connection] } });
}

afterEach(() => {
  cleanup(); jest.restoreAllMocks(); sqlExecutionState.getState().clear();
});

test('uses default limits when creating a root and a child query', () => {
  jest.spyOn(modelReader, 'getSObjectApiName').mockReturnValue('Account');
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [] } as unknown as SObject);
  modelState.getState().setOrg(orgKey);
  modelState.getState().setSObject(0);
  modelState.getState().gotoChild({ orgSfName: orgKey, sObjectLocalId: 2,
    childSObject: 'Contact', relationshipName: 'Contacts', fieldNameAPI: 'AccountId' });
  render(<WhereClausePanel />);
  expect(screen.getByRole('spinbutton', { name: 'Other Account 0' })).toHaveValue(50);
  expect(screen.getByRole('checkbox', { name: '1 Contact 1' })).toBeChecked();
});

test('sets independent limits atomically and renders or omits LIMIT in the right block', () => {
  setup();
  modelState.getState().setLimit(0, undefined);
  expect(modelState.getState().sqlState.sql).toBe('SELECT Id, (SELECT Id FROM Contacts LIMIT 1) FROM Account');
  modelState.getState().setLimit(2, 250);
  expect(modelState.getState().sqlState.sql).toBe('SELECT Id, (SELECT Id FROM Contacts LIMIT 250) FROM Account');
  modelState.getState().setLimit(0, 1);
  expect(modelState.getState().sqlState.sql).toMatch(/FROM Account LIMIT 1$/);
  const before = modelState.getState().queryState;
  for (const invalid of [0, 2001, -1, 1.5, Number.NaN]) {
    expect(() => modelState.getState().setLimit(0, invalid)).toThrow();
    expect(modelState.getState().queryState).toBe(before);
  }
  expect(() => modelState.getState().setLimit(1, 50)).toThrow('bloque SOQL');
  expect(modelState.getState().queryState).toBe(before);
});

test('shows four columns, exclusive modes and an accessible error without WHERE conditions', () => {
  setup();
  render(<WhereClausePanel />);
  const table = screen.getByRole('table', { name: 'LIMIT por objeto' });
  expect(within(table).getAllByRole('columnheader').map(cell => cell.textContent))
    .toEqual(['Object', 'All', '1', 'Other']);
  expect(within(table).getAllByRole('row')).toHaveLength(3);
  expect(within(table).queryByText('User')).not.toBeInTheDocument();
  expect(screen.getByText('No hay condiciones WHERE en la consulta.')).toBeInTheDocument();
  const rootAll = screen.getByRole('checkbox', { name: 'All Account 0' });
  const rootOne = screen.getByRole('checkbox', { name: '1 Account 0' });
  const rootOther = screen.getByRole('spinbutton', { name: 'Other Account 0' });
  const childOne = screen.getByRole('checkbox', { name: '1 Contact 2' });
  expect(rootOther).toHaveValue(50);
  expect(childOne).toBeChecked();
  fireEvent.click(rootAll);
  expect(rootAll).toBeChecked();
  expect(rootOne).not.toBeChecked();
  expect(rootOther).toHaveValue(null);
  expect(childOne).toBeChecked();
  expect(modelState.getState().sqlState.sql).not.toMatch(/FROM Account LIMIT/);
  fireEvent.change(rootOther, { target: { value: '250' } });
  fireEvent.blur(rootOther);
  expect(rootAll).not.toBeChecked();
  expect(rootOther).toHaveValue(250);
  expect(modelState.getState().sqlState.sql).toMatch(/FROM Account LIMIT 250$/);
  fireEvent.change(rootOther, { target: { value: '2500' } });
  fireEvent.blur(rootOther);
  expect(screen.getByRole('alert')).toHaveTextContent('entre 2 y 2000');
  expect(rootOther).toHaveAttribute('aria-invalid', 'true');
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).limit).toBe(250);
  fireEvent.click(rootOne);
  expect(rootOne).toBeChecked();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(childOne).toBeChecked();
});

test.each([250, 2000, undefined])('uses the root limit %s for API execution and leaves child limits independent', async rootLimit => {
  setup();
  modelState.getState().setLimit(0, rootLimit);
  applicationState.getState().setContextLevel(CONTEXT_LEVEL.OBJECT);
  sqlExecutionState.getState().initializeSqlExecution();
  jest.spyOn(globalThis, 'confirm').mockReturnValue(true);
  const send = jest.spyOn(Proxy, 'sendSoqlAdapter').mockResolvedValue({
    done: false, totalSize: 2, records: [{ Id: 'one' }], limit: rootLimit ?? 2000, cursor: 'next',
  });
  const next = jest.spyOn(Proxy, 'nextSoqlPage').mockResolvedValue({
    done: true, totalSize: 2, records: [{ Id: 'two' }], limit: rootLimit ?? 2000,
  });
  const command = readCommand('query run', CONTEXT_LEVEL.OBJECT)!;
  act(() => command.action({ model: modelState.getState(), view: viewState.getState(),
    application: applicationState.getState(), data: dataState.getState() }));
  await waitFor(() => expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('PARTIAL'));
  expect(send).toHaveBeenCalledWith(orgKey, modelState.getState().sqlState.sql,
    expect.any(AbortSignal), rootLimit ?? 2000);
  expect(globalThis.confirm).toHaveBeenCalledWith(expect.stringContaining(`límite de ${rootLimit ?? 2000} filas`));
  act(() => sqlExecutionState.getState().nextPage());
  await waitFor(() => expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('DONE'));
  expect(next).toHaveBeenCalledTimes(1);
  expect(sqlExecutionState.getState().records).toHaveLength(2);
});

test('passes the selected execution quota in the HTTP request', async () => {
  const request = jest.spyOn(apiClient, 'request').mockResolvedValue({ done: true,
    totalSize: 0, records: [], limit: 250 });
  await Proxy.sendSoqlAdapter(orgKey, 'SELECT Id FROM Account LIMIT 250', undefined, 250);
  expect(request).toHaveBeenCalledWith('query', expect.objectContaining({
    method: 'POST', body: { orgKey, query: 'SELECT Id FROM Account LIMIT 250', limit: 250 },
  }));
});

test('saves and reloads All and child Other selections', async () => {
  setup();
  savedSoqlState.getState().clearCurrent();
  modelState.getState().setLimit(0, undefined);
  modelState.getState().setLimit(2, 125);
  const saved = await saveCurrentSoql('Limit choices');
  expect(saved.formatVersion).toBe(4);
  expect((saved.queryState.queryElemnts[0] as PrimaryQuery).limit).toBeUndefined();
  expect((saved.queryState.queryElemnts[2] as NestedQuery).limit).toBe(125);
  jest.spyOn(Proxy, 'getSObjectsAdapter').mockResolvedValue([]);
  jest.spyOn(modelReader, 'getSObjectLocalIdbyName').mockImplementation((_org, name) =>
    ({ Account: 0, User: 1, Contact: 2 } as Record<string, number>)[name] ?? null);
  jest.spyOn(Proxy, 'getFieldsAdapter').mockImplementation(async (_org, objectId) => objectId === 0 ? [
    { fieldApiName: 'Id', fieldLocalId: 0 },
    { fieldApiName: 'OwnerId', fieldLocalId: 1, relationshipName: 'Owner', type: 'reference' },
  ] as GetFieldsIndex[] : [{ fieldApiName: 'Id', fieldLocalId: 0 }] as GetFieldsIndex[]);
  jest.spyOn(modelReader, 'getField').mockReturnValue({ referenceTo: ['User'] } as Fields);
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [{ fieldLocalId: 0, name: 'Id' }] } as SObject);
  jest.spyOn(Proxy, 'getChildRelationships').mockReturnValue([]);
  await loadSavedSoql(saved.id);
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).limit).toBeUndefined();
  expect((modelState.getState().queryState.queryElemnts[2] as NestedQuery).limit).toBe(125);
  expect(modelState.getState().sqlState.sql).toBe('SELECT Id, (SELECT Id FROM Contacts LIMIT 125) FROM Account');
  expect((await savedSoqlRepository.get(saved.id))?.formatVersion).toBe(4);
});
