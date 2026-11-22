import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { effectiveWhereLogic } from '../src/core/soql/whereLogic';
import WhereClausePanel from '../src/components/organisms/sObjectPanel/whereClausePanel';
import { whereFieldLabel } from '../src/services/salesforceSchema/whereFieldLabel';
import { modelReader } from '../src/services/salesforceSchema/proxy';
import modelState from '../src/store/modelState';

globalThis.structuredClone ??= <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const orgKey = '00D000000000001:005000000000001';
const selected = { fieldId: { fieldApiName: 'Id', fieldIndex: 0 },
  isAggregateFunction: false, makeGroupBy: false, soqlFunction: '%1' };
const condition = (name: string, index: number, value: string, relationshipPath: string[] = []): SimpleCondition => ({
  field: { fieldApiName: name, fieldIndex: index, relationshipPath },
  operator: '=', value: `'${value}'`, sqlString: `${name} = '${value}'`,
});
function query(): QueryState {
  return { indexCurrentElement: 0, queryElemnts: [
    { type: 'ROOT', parent: -1, level: 0, limit: 50,
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Contact', sObjectLocalId: 0 },
      selectClause: { fields: [selected] },
      where: [condition('LastName', 1, 'Demo'), condition('Industry', 2, 'Tech', ['Account'])],
      whereLogic: 'C1 OR C2' },
    { type: 'RELETED', parent: 0, level: 1, path: 'Account.', relatedTo: 'Account',
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Account', sObjectLocalId: 1 },
      selectClause: { fields: [] } },
    { type: 'SUBQUERY', parent: 0, level: 1, limit: 1, relationshipName: 'Cases',
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Case', sObjectLocalId: 2 },
      selectClause: { fields: [selected] }, where: [condition('Status', 1, 'New')], whereLogic: 'C1' },
  ] };
}

afterEach(() => { cleanup(); jest.restoreAllMocks(); });

test('prunes AND, OR, groups and repeated references without renumbering conditions', () => {
  expect(effectiveWhereLogic('C1 AND C2', [true, false]).expression).toBe('C1');
  expect(effectiveWhereLogic('C1 OR C2', [true, false]).expression).toBe('C1');
  expect(effectiveWhereLogic('(C1 OR C2) AND C3', [true, false, true]).expression).toBe('C1 AND C3');
  expect(effectiveWhereLogic('(C1 OR C2) AND C3', [true, true, true]).expression).toBe('(C1 OR C2) AND C3');
  expect(effectiveWhereLogic('C1 OR C1 AND C2', [false, true]).expression).toBe('C2');
  expect(effectiveWhereLogic('C2', [true, false]).expression).toBeNull();
});

test('a checkbox updates effective logic and SQL, preserving the editable expression and other blocks', () => {
  modelState.setState({ queryState: query() });
  modelState.getState().setWhereLogic(0, '(C1 OR C2)');
  const original = modelState.getState().sqlState.sql;
  const before = modelState.getState().queryState;
  modelState.getState().setWhereConditionEnabled(0, 1, false);
  const current = modelState.getState();
  expect(current.queryState).not.toBe(before);
  expect((before.queryElemnts[0] as PrimaryQuery).where?.[1].enabled).toBeUndefined();
  expect((current.queryState.queryElemnts[0] as PrimaryQuery).whereLogic).toBe('(C1 OR C2)');
  expect(current.sqlState.sql).toContain("WHERE LastName = 'Demo'");
  expect(current.sqlState.sql).toContain("FROM Cases WHERE Status = 'New'");
  modelState.getState().setWhereConditionEnabled(0, 0, false);
  expect(modelState.getState().sqlState.sql).not.toContain('FROM Contact WHERE');
  expect(modelState.getState().sqlState.sql).toContain('FROM Cases WHERE');
  modelState.getState().setWhereConditionEnabled(0, 0, true);
  modelState.getState().setWhereConditionEnabled(0, 1, true);
  expect(modelState.getState().sqlState.sql).toBe(original);
});

test('the panel shows accessible toggles, effective logic, API paths and current-org field labels', () => {
  const getSObject = jest.spyOn(modelReader, 'getSObject').mockImplementation((org, objectId) => ({
    fields: objectId === 0 ? [{ name: 'LastName', label: 'Surname' }] :
      objectId === 1 ? [{ name: 'Industry', label: org === orgKey ? 'Sector' : 'Industry in UAT' }] :
        [{ name: 'Status', label: 'Case status' }],
  } as SObject));
  modelState.setState({ queryState: query() });
  render(<WhereClausePanel />);
  expect(screen.getByRole('checkbox', { name: 'Active C1 for Contact' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Active C1 for Case' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Active C2 for Contact' })).toBeChecked();
  expect(screen.getByText('(Account.Industry)')).toBeInTheDocument();
  expect(screen.getByText('(Sector)')).toBeInTheDocument();
  expect(screen.getByText('(Surname)')).toBeInTheDocument();
  expect(screen.getByText('(Case status)')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Active C2 for Contact' }));
  expect(screen.getByText('Inactive')).toBeInTheDocument();
  const rootEditor = screen.getByRole('textbox', { name: 'WHERE logic for Contact' });
  expect(within(rootEditor.closest('section')!).getByText('Effective WHERE logic: C1')).toBeInTheDocument();
  expect(rootEditor).toHaveValue('C1 OR C2');
  expect(getSObject).toHaveBeenCalledWith(orgKey, 1);
});

test('field labels resolve from the destination org and missing metadata does not break the panel', () => {
  const state = query();
  const field = (state.queryElemnts[0] as PrimaryQuery).where![1].field;
  jest.spyOn(modelReader, 'getSObject').mockImplementation((org) => ({
    fields: [{ name: 'Industry', label: org === orgKey ? 'Sector' : 'UAT sector' }],
  } as SObject));
  expect(whereFieldLabel(state, 0, field)).toBe('Sector');
  state.queryElemnts.forEach(element => { element.sObjectId.orgSfName = '00D000000000002:005000000000002'; });
  expect(whereFieldLabel(state, 0, field)).toBe('UAT sector');
  jest.spyOn(modelReader, 'getSObject').mockImplementation(() => { throw new Error('Metadata unavailable'); });
  modelState.setState({ queryState: state });
  render(<WhereClausePanel />);
  expect(screen.getAllByText('(Label unavailable)').length).toBeGreaterThan(0);
});
