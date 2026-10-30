import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';
import SOQLEdit from '../src/components/organisms/SOQLEdit/soqlEdit';
import { legacySqlState } from '../src/core/soql/legacyAdapter';
import { CONTEXT_LEVEL, readCommand } from '../src/core/commandManager';
import Proxy from '../src/services/salesforceSchema/proxy';
import applicationState from '../src/store/applicationState';
import dataState from '../src/store/dataState';
import modelState from '../src/store/modelState';
import sessionState from '../src/store/sessionState';
import sqlExecutionState from '../src/store/sqlExecutionState';
import viewState from '../src/store/viewState';

const orgKey = '00D000000000001:005000000000001';
const field = (fieldApiName: string): SelectClauseField => ({
  fieldId: { fieldApiName, fieldIndex: 0 }, soqlFunction: '%1',
  isAggregateFunction: false, makeGroupBy: false,
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  sqlExecutionState.getState().clear();
});

it('shows and executes SOQL with a child of a child under the correct parent', () => {
  const queryState: QueryState = { indexCurrentElement: 2, queryElemnts: [
    { type: 'ROOT', parent: -1, level: 0, limit: 50,
      sObjectId: { orgSfName: orgKey, sObjectLocalId: 0, sObjectApiName: 'Account' },
      selectClause: { fields: [field('Name')] } },
    { type: 'SUBQUERY', parent: 0, level: 1, limit: 1, relationshipName: 'Contacts',
      sObjectId: { orgSfName: orgKey, sObjectLocalId: 1, sObjectApiName: 'Contact' },
      selectClause: { fields: [field('LastName')] } },
    { type: 'SUBQUERY', parent: 1, level: 2, limit: 1, relationshipName: 'Cases',
      sObjectId: { orgSfName: orgKey, sObjectLocalId: 2, sObjectApiName: 'Case' },
      selectClause: { fields: [field('Subject')] } },
    { type: 'SUBQUERY', parent: 0, level: 1, limit: 1, relationshipName: 'Opportunities',
      sObjectId: { orgSfName: orgKey, sObjectLocalId: 3, sObjectApiName: 'Opportunity' },
      selectClause: { fields: [field('Amount')] } },
  ] };
  const sqlState = legacySqlState(queryState);
  const expected = 'SELECT Name, (SELECT LastName, (SELECT Subject FROM Cases LIMIT 1) FROM Contacts LIMIT 1), (SELECT Amount FROM Opportunities LIMIT 1) FROM Account LIMIT 50';
  expect(sqlState).toEqual({ sql: expected, isValid: true });

  sessionState.setState({ publicSession: { version: 1, activeOrgKey: orgKey, connections: [{
    orgKey, organizationId: '00D000000000001', userId: '005000000000001', userName: 'fixture',
    alias: 'Integration', instanceUrl: 'https://example.my.salesforce.com',
    loginHost: 'test.salesforce.com', environmentKind: 'SANDBOX', status: 'CONNECTED',
  }] } });
  act(() => {
    modelState.setState({ queryState, sqlState, state: { ...modelState.getState().state, orgSfName: orgKey } });
    sqlExecutionState.getState().initializeSqlExecution();
    applicationState.getState().setContextLevel(CONTEXT_LEVEL.OBJECT);
  });
  render(<SOQLEdit />);
  expect(screen.getByRole('textbox', { name: 'SOQL actual · solo lectura' })).toHaveValue(expected);

  jest.spyOn(globalThis, 'confirm').mockReturnValue(true);
  const execute = jest.spyOn(Proxy, 'sendSoqlAdapter').mockResolvedValue({
    done: true, totalSize: 0, records: [], limit: 200,
  });
  const run = readCommand('query run', CONTEXT_LEVEL.OBJECT)!;
  act(() => run.action({ model: modelState.getState(), view: viewState.getState(),
    application: applicationState.getState(), data: dataState.getState() }));
  expect(execute).toHaveBeenCalledWith(orgKey, expected, expect.any(AbortSignal));
  expect(viewState.getState().currentView).toBe('SQL_RESULT');
});
