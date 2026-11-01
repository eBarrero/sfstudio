import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';
import HomePage from '../src/components/pages/homePage/homepage';
import { CONTEXT_LEVEL, getCommands, getMenus, readCommand, SOQL_CMD } from '../src/core/commandManager';
import applicationState from '../src/store/applicationState';
import dataState from '../src/store/dataState';
import modelState from '../src/store/modelState';
import sqlExecutionState from '../src/store/sqlExecutionState';
import viewState from '../src/store/viewState';

jest.mock('../src/components/organisms/dbConnectionManager/dbConnectionManager', () => ({
  __esModule: true, default: () => null,
}));
jest.mock('../src/components/organisms/SOQLPath/soqlPath', () => ({
  __esModule: true, default: () => null,
}));
jest.mock('../src/components/organisms/console/console', () => ({
  __esModule: true, default: () => null,
}));

afterEach(cleanup);

it('opens the current SOQL in a read-only view from menu, toolbar and console', () => {
  const sql = 'SELECT Id, Name FROM Account LIMIT 50';
  act(() => {
    modelState.setState({ sqlState: { sql, isValid: true } });
    applicationState.getState().initializeApp();
    sqlExecutionState.getState().initializeSqlExecution();
    applicationState.getState().setContextLevel(CONTEXT_LEVEL.OBJECT);
    viewState.getState().setCurrentView('sobject');
  });

  const edit = readCommand(SOQL_CMD.EDIT_SOQL.command, CONTEXT_LEVEL.OBJECT)!;
  expect(edit.actionId).toBe('query.edit');
  expect(edit.iconSymbol).toBe('✎');
  expect(getCommands(CONTEXT_LEVEL.OBJECT)).toContain(edit);
  expect(getMenus(CONTEXT_LEVEL.OBJECT).find(menu => menu.label === 'SOQL')?.options)
    .toContainEqual({ label: 'Edit SOQL', command: 'query edit' });

  applicationState.getState().exeCommandFromUI('query edit');
  expect(applicationState.getState().commandConfirmed?.actionId).toBe(edit.actionId);
  act(() => applicationState.getState().commandConfirmed!.action({
    model: modelState.getState(), view: viewState.getState(),
    application: applicationState.getState(), data: dataState.getState(),
  }));
  expect(applicationState.getState().context_level).toBe(CONTEXT_LEVEL.SQL_EDITION);
  expect(viewState.getState().currentView).toBe('SOQL_EDIT');

  const page = render(<HomePage />);
  const query = screen.getByRole('textbox', { name: 'SOQL actual · solo lectura' });
  expect(query).toHaveValue(sql);
  expect(query).toHaveAttribute('readonly');
  act(() => modelState.setState({ sqlState: { sql: 'SELECT Id FROM Contact', isValid: true } }));
  expect(query).toHaveValue('SELECT Id FROM Contact');
  act(() => modelState.setState({ sqlState: { sql: '', isValid: false } }));
  expect(screen.getByText('La consulta aparecerá aquí cuando se haya formado una SOQL válida.')).toBeInTheDocument();
  page.unmount();

  act(() => modelState.setState({ sqlState: { sql: 'SELECT Id FROM Contact', isValid: true } }));

  const back = readCommand('Back', CONTEXT_LEVEL.SQL_EDITION)!;
  act(() => back.action({ model: modelState.getState(), view: viewState.getState(),
    application: applicationState.getState(), data: dataState.getState() }));
  expect(viewState.getState().currentView).toBe('sobject');
  expect(applicationState.getState().context_level).toBe(CONTEXT_LEVEL.OBJECT);

  applicationState.getState().exeCommand('query edit');
  expect(applicationState.getState().commandConfirmed?.actionId).toBe(edit.actionId);
  act(() => applicationState.getState().commandConfirmed!.action({
    model: modelState.getState(), view: viewState.getState(),
    application: applicationState.getState(), data: dataState.getState(),
  }));
  expect(viewState.getState().currentView).toBe('SOQL_EDIT');
  expect(modelState.getState().sqlState.sql).toBe('SELECT Id FROM Contact');
});
