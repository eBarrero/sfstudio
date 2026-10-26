import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SObjectsPanel from '../src/components/organisms/schemaPanel/schemaPanel';
import { getDescribe, getDescribeObject } from '../src/services/salesforceSchema/controller';
import Proxy from '../src/services/salesforceSchema/proxy';
import { metadataObjectStatus } from '../src/services/salesforceSchema/snapshotAdapter';
import { dispatchExplorerAction } from '../src/core/explorerActions';
import { CONTEXT_LEVEL, readCommand } from '../src/core/commandManager';
import applicationState from '../src/store/applicationState';
import dataState from '../src/store/dataState';
import modelState from '../src/store/modelState';
import sessionState from '../src/store/sessionState';
import viewState from '../src/store/viewState';

jest.mock('../src/services/salesforceSchema/controller', () => ({
  getDescribe: jest.fn(), getDescribeObject: jest.fn(),
}));

const integrationKey = '00D000000000001:005000000000001';
const uatKey = '00D000000000002:005000000000002';
const connection = (orgKey: string, alias: string) => ({
  orgKey, organizationId: orgKey.split(':')[0], userId: orgKey.split(':')[1],
  userName: `fixture-${alias}`, alias, instanceUrl: 'https://example.test',
  loginHost: 'test.salesforce.com', environmentKind: 'SANDBOX' as const,
  status: 'CONNECTED' as const,
});
const account = { name: 'Account', label: 'Cuenta', labelPlural: 'Cuentas',
  keyPrefix: '001', custom: false, queryable: true, createable: true,
  updateable: true, deletable: true };
const detail = (fieldName: string) => ({ ...account,
  fields: [{ name: fieldName, label: fieldName, type: 'string', length: 80,
    precision: 0, scale: 0, unique: false, custom: fieldName.endsWith('__c'),
    referenceTo: [], relationshipName: null, picklistValues: [],
    nillable: true, createable: true, updateable: true }],
  childRelationships: [],
});

beforeAll(() => {
  function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
  globalThis.structuredClone ??= clone;
  sessionState.getState().setWorkspace({ version: 1, activeOrgKey: integrationKey,
    connections: [connection(integrationKey, 'Integration'), connection(uatKey, 'UAT')] });
});
afterEach(cleanup);

test('out-of-order global responses keep the active org and its filters', async () => {
  let resolveIntegration!: (value: { sobjects: typeof account[] }) => void;
  (getDescribe as jest.Mock).mockImplementation((orgKey: string) => orgKey === integrationKey
    ? new Promise(done => { resolveIntegration = done; })
    : Promise.resolve({ sobjects: [{ ...account, label: 'UAT Account' }] }));
  act(() => {
    dataState.getState().activateOrg(integrationKey);
    dataState.setState({ sObjectsFilter: { ...dataState.getState().sObjectsFilter,
      custom: null, searchText: 'Acc' } });
    dataState.getState().loadSchema(integrationKey);
    sessionState.getState().setWorkspace({ ...sessionState.getState().publicSession,
      activeOrgKey: uatKey });
    dataState.getState().activateOrg(uatKey);
    dataState.setState({ sObjectsFilter: { ...dataState.getState().sObjectsFilter,
      custom: null } });
    dataState.getState().loadSchema(uatKey);
  });
  await waitFor(() => expect(dataState.getState().sobjects.map(row => row.name)).toEqual(['Account']));
  resolveIntegration({ sobjects: [account] });
  await waitFor(() => expect(getDescribe).toHaveBeenCalledTimes(2));
  expect(dataState.getState().activeOrgKey).toBe(uatKey);
  expect(dataState.getState().sObjectsFilter.searchText).toBe('');
  expect(dataState.getState().sobjects[0].label).toBe('UAT Account');
  act(() => dataState.getState().activateOrg(integrationKey));
  expect(dataState.getState().sObjectsFilter.searchText).toBe('Acc');
});

test('Account opens with each org’s own fields via button and command', async () => {
  (getDescribeObject as jest.Mock).mockImplementation((orgKey: string) => Promise.resolve(
    detail(orgKey === integrationKey ? 'Integration__c' : 'UAT__c')));
  act(() => {
    sessionState.getState().setWorkspace({ ...sessionState.getState().publicSession,
      activeOrgKey: integrationKey });
    dataState.getState().activateOrg(integrationKey);
    dataState.getState().loadSchema(integrationKey);
    modelState.getState().setOrg(integrationKey);
    applicationState.getState().setContextLevel(CONTEXT_LEVEL.ORG);
  });
  const view = render(<SObjectsPanel />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Account' }));
  await waitFor(() => expect(dataState.getState().sObjectFields[0].fieldApiName).toBe('Integration__c'));
  expect(viewState.getState().currentView).toBe('sobject');
  expect(modelState.getState().state.orgSfName).toBe(integrationKey);
  expect(metadataObjectStatus(integrationKey, 'Account').state).toBe('FRESH');
  expect(readCommand('Integration__c', CONTEXT_LEVEL.OBJECT)).toBeDefined();

  act(() => {
    sessionState.getState().setWorkspace({ ...sessionState.getState().publicSession,
      activeOrgKey: uatKey });
    dataState.getState().activateOrg(uatKey);
    modelState.getState().setOrg(uatKey);
    applicationState.getState().setContextLevel(CONTEXT_LEVEL.ORG);
  });
  expect(readCommand('Integration__c', CONTEXT_LEVEL.OBJECT)).toBeUndefined();
  await act(async () => { await dataState.getState().loadSchema(uatKey); });
  await waitFor(() => expect(dataState.getState().sobjects[0]?.name).toBe('Account'));
  act(() => { applicationState.getState().exeCommand('object open Account'); });
  const command = applicationState.getState().commandConfirmed!;
  expect(command.actionId).toBe('object.open');
  (command.action as () => void)();
  await waitFor(() => expect(dataState.getState().sObjectFields[0].fieldApiName).toBe('UAT__c'));
  expect(modelState.getState().state.orgSfName).toBe(uatKey);
  expect(metadataObjectStatus(uatKey, 'Account').state).toBe('FRESH');
  expect(readCommand('UAT__c', CONTEXT_LEVEL.OBJECT)).toBeDefined();
  expect(getDescribeObject).toHaveBeenCalledWith(integrationKey, 'Account');
  expect(getDescribeObject).toHaveBeenCalledWith(uatKey, 'Account');
  view.unmount();
});

test('late object response cannot reopen an old org', async () => {
  let resolveOld!: (value: GetFieldsIndex[]) => void;
  const uatFields = structuredClone(dataState.getState().sObjectFields);
  const getFields = jest.spyOn(Proxy, 'getFieldsAdapter').mockImplementation((orgKey: string) =>
    orgKey === integrationKey ? new Promise(done => { resolveOld = done; }) :
      Promise.resolve(uatFields));
  act(() => {
    sessionState.getState().setWorkspace({ ...sessionState.getState().publicSession,
      activeOrgKey: integrationKey });
    dataState.getState().activateOrg(integrationKey);
    modelState.getState().setOrg(integrationKey);
  });
  const oldOpen = dispatchExplorerAction({ id: 'object.open', objectName: 'Account' });
  act(() => {
    sessionState.getState().setWorkspace({ ...sessionState.getState().publicSession,
      activeOrgKey: uatKey });
    dataState.getState().activateOrg(uatKey);
    modelState.getState().setOrg(uatKey);
  });
  await dispatchExplorerAction({ id: 'object.open', objectName: 'Account' });
  resolveOld([{ ...uatFields[0], fieldApiName: 'Integration__c' }]);
  expect(await oldOpen).toBe(false);
  expect(dataState.getState().sObjectFields[0].fieldApiName).toBe('UAT__c');
  getFields.mockRestore();
});
