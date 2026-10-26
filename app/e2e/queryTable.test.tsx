import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { queryTable } from '../src/core/queryTable';
import ResultSheet from '../src/components/organisms/resultSheet/resultSheet';
import applicationState from '../src/store/applicationState';
import sqlExecutionState from '../src/store/sqlExecutionState';
import { CONTEXT_LEVEL } from '../src/core/commandManager';

afterEach(() => { cleanup(); sqlExecutionState.getState().clear(); });

it('preserves null, boolean, relationships and columns introduced by later rows', () => {
  const result = queryTable([
    { Id: 'a', Active__c: false, Owner: { attributes: { type: 'User' }, Name: 'Owner A' }, Optional__c: null,
      Contacts: { records: [{ Name: 'Ada' }, { Name: 'Bea' }] } },
    { Id: 'b', Active__c: true, New__c: 7 },
  ]);
  expect(result.columns).toEqual(['Id', 'Active__c', 'Owner.Name', 'Optional__c', 'Contacts.Name', 'New__c']);
  expect(result.rows[0]).toEqual(['a', false, 'Owner A', null, ['Ada', 'Bea'], null]);
  expect(result.rows[1]).toEqual(['b', true, null, null, null, 7]);
});

it('renders query results and routes next and clear buttons to the same ActionId as commands', () => {
  sqlExecutionState.setState({ records: [{ Active__c: false, Optional__c: null,
    Owner: { Name: 'Owner A' } }], sqlExecutionStatus: 'PARTIAL', cursor: 'opaque' });
  applicationState.setState({ context_level: CONTEXT_LEVEL.SQL_EXECUTION });
  sqlExecutionState.getState().initializeSqlExecution();
  render(<ResultSheet />);
  expect(screen.getByText('false')).toBeInTheDocument();
  expect(screen.getByText('—')).toBeInTheDocument();
  expect(screen.getByText('Owner.Name')).toBeInTheDocument();
  const next = screen.getByRole('button', { name: 'Cargar siguiente página' });
  expect(next).toHaveAttribute('data-action-id', 'query.next');
  fireEvent.click(next);
  expect(applicationState.getState().commandConfirmed?.actionId).toBe('query.next');
  applicationState.getState().exeCommand('query next');
  expect(applicationState.getState().commandConfirmed?.actionId).toBe('query.next');
  const clear = screen.getByRole('button', { name: 'Limpiar resultados' });
  expect(clear).toHaveAttribute('data-action-id', 'query.clear');
  fireEvent.click(clear);
  expect(applicationState.getState().commandConfirmed?.actionId).toBe('query.clear');
  applicationState.getState().exeCommand('query clear');
  expect(applicationState.getState().commandConfirmed?.actionId).toBe('query.clear');
});
