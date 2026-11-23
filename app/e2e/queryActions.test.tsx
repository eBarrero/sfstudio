import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SOQLPanel from '../src/components/organisms/SOQLPanel/soqlPanel';
import ResultSheet from '../src/components/organisms/resultSheet/resultSheet';
import Proxy from '../src/services/salesforceSchema/proxy';
import applicationState from '../src/store/applicationState';
import dataState from '../src/store/dataState';
import modelState from '../src/store/modelState';
import sessionState from '../src/store/sessionState';
import sqlExecutionState from '../src/store/sqlExecutionState';
import viewState from '../src/store/viewState';
import { CONTEXT_LEVEL, getMenus, readCommand } from '../src/core/commandManager';
import * as sessionService from '../src/services/session/model';

const orgKey = '00D000000000001:005000000000001';
const workspace = { version: 1 as const, activeOrgKey: orgKey,
  connections: [{ orgKey, organizationId: '00D000000000001', userId: '005000000000001',
    userName: 'fixture', alias: 'Integration', instanceUrl: 'https://example.my.salesforce.com',
    loginHost: 'test.salesforce.com', environmentKind: 'SANDBOX' as const, status: 'CONNECTED' as const }] };

function executeConfirmed() {
  const command = applicationState.getState().commandConfirmed;
  expect(command).toBeDefined();
  act(() => { command!.action({ model: modelState.getState(), view: viewState.getState(),
    application: applicationState.getState(), data: dataState.getState() }); });
  return command!.actionId;
}

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  sqlExecutionState.getState().clear();
});

it('runs, paginates and clears from UI and console without storing records', async () => {
  sessionState.setState({ publicSession: workspace });
  modelState.setState({ state: { ...modelState.getState().state, orgSfName: orgKey },
    sqlState: { sql: 'SELECT Name FROM Account LIMIT 2', isValid: true } });
  applicationState.setState({ context_level: CONTEXT_LEVEL.OBJECT });
  sqlExecutionState.getState().initializeSqlExecution();
  const confirm = jest.spyOn(globalThis, 'confirm').mockImplementation(() => { throw new Error('Unexpected confirmation'); });
  const save = jest.spyOn(Storage.prototype, 'setItem');
  const indexedDb = jest.spyOn(indexedDB, 'open');
  const first = jest.spyOn(Proxy, 'sendSoqlAdapter').mockResolvedValue({ done: false,
    totalSize: 2, records: [{ Name: 'first' }], limit: 2, cursor: 'opaque' });
  const next = jest.spyOn(Proxy, 'nextSoqlPage').mockResolvedValue({ done: true,
    totalSize: 2, records: [{ Name: 'second' }], limit: 2 });

  const editor = render(<SOQLPanel />);
  expect(screen.getByText(/Destino: Integration/)).toBeInTheDocument();
  expect(getMenus(CONTEXT_LEVEL.OBJECT).find(menu => menu.label === 'SOQL')?.options)
    .toContainEqual({ label: 'Run SOQL', command: 'query run' });
  fireEvent.click(screen.getByRole('button', { name: 'Ejecutar en Integration' }));
  expect(executeConfirmed()).toBe('query.run');
  await waitFor(() => expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('PARTIAL'));
  expect(first).toHaveBeenCalledTimes(1);
  expect(confirm).not.toHaveBeenCalled();
  editor.unmount();

  const sheet = render(<ResultSheet />);
  fireEvent.click(screen.getByRole('button', { name: 'Cargar siguiente página' }));
  expect(executeConfirmed()).toBe('query.next');
  await waitFor(() => expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('DONE'));
  expect(next).toHaveBeenCalledTimes(1);
  expect(screen.getByText('second')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar resultados' }));
  expect(executeConfirmed()).toBe('query.clear');
  expect(sqlExecutionState.getState().records).toEqual([]);
  sheet.unmount();

  applicationState.getState().setContextLevel(CONTEXT_LEVEL.OBJECT);
  applicationState.getState().exeCommand('query run');
  expect(executeConfirmed()).toBe('query.run');
  await waitFor(() => expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('PARTIAL'));
  applicationState.getState().exeCommand('query next');
  expect(executeConfirmed()).toBe('query.next');
  await waitFor(() => expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('DONE'));
  applicationState.getState().exeCommand('query clear');
  expect(executeConfirmed()).toBe('query.clear');
  expect(sqlExecutionState.getState().records).toEqual([]);
  expect(save).not.toHaveBeenCalled();
  expect(indexedDb).not.toHaveBeenCalled();
});

it('rejects invalid queries and disconnected targets without sending a request or opening results', () => {
  sessionState.setState({ publicSession: workspace });
  applicationState.setState({ context_level: CONTEXT_LEVEL.OBJECT });
  sqlExecutionState.getState().initializeSqlExecution();
  const send = jest.spyOn(Proxy, 'sendSoqlAdapter');
  const command = readCommand('query run', CONTEXT_LEVEL.OBJECT)!;
  const execute = () => command.action({ model: modelState.getState(), view: viewState.getState(),
    application: applicationState.getState(), data: dataState.getState() });
  modelState.setState({ state: { ...modelState.getState().state, orgSfName: orgKey },
    sqlState: { sql: '', isValid: false } });
  viewState.getState().setCurrentView('sobject');
  expect(execute).toThrow('#Error.SQL_NOT_VALID');
  expect(send).not.toHaveBeenCalled();
  expect(viewState.getState().currentView).toBe('sobject');

  modelState.setState({ sqlState: { sql: 'SELECT Id FROM Account LIMIT 50', isValid: true } });
  sessionState.setState({ publicSession: { ...workspace,
    connections: [{ ...workspace.connections[0], status: 'REAUTH_REQUIRED' }] } });
  expect(execute).toThrow('Reautentica y selecciona el destino');
  expect(send).not.toHaveBeenCalled();
  expect(viewState.getState().currentView).toBe('sobject');
});

it('cancels pending query through the same UI and command action', () => {
  sessionState.setState({ publicSession: workspace });
  applicationState.setState({ context_level: CONTEXT_LEVEL.SQL_EXECUTION });
  sqlExecutionState.getState().initializeSqlExecution();
  sqlExecutionState.setState({ sqlExecutionStatus: 'LOADING', records: [] });
  render(<ResultSheet />);
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(executeConfirmed()).toBe('query.cancel');
  expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('INIT');
  act(() => { sqlExecutionState.setState({ sqlExecutionStatus: 'LOADING' }); });
  applicationState.getState().exeCommand('query cancel');
  expect(executeConfirmed()).toBe('query.cancel');
  expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('INIT');
});

it('clears records and cursor when closing the workspace', async () => {
  jest.spyOn(sessionService, 'closeWorkspace').mockResolvedValue(undefined);
  sessionState.setState({ publicSession: workspace });
  sqlExecutionState.setState({ sqlExecutionStatus: 'PARTIAL', targetOrgKey: orgKey,
    records: [{ Name: 'temporary' }], cursor: 'opaque' });
  await sessionState.getState().closeWorkspace();
  expect(sqlExecutionState.getState().records).toEqual([]);
  expect(sqlExecutionState.getState().cursor).toBeNull();
  expect(sessionState.getState().publicSession.connections).toEqual([]);
});
