import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { whereOwner } from '../src/core/soql/whereOwnership';
import WhereClausePanel from '../src/components/organisms/sObjectPanel/whereClausePanel';
import { modelReader } from '../src/services/salesforceSchema/proxy';
import modelState from '../src/store/modelState';

globalThis.structuredClone ??= function cloneForTest<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
};

const object = (name: string, id: number) => ({ orgSfName: 'fixture', sObjectApiName: name, sObjectLocalId: id });
const selected = (name: string) => ({ fieldId: { fieldApiName: name, fieldIndex: 0 },
  isAggregateFunction: false, makeGroupBy: false, soqlFunction: '%1' });
const condition = (name: string, index: number, value: string): SimpleCondition => ({
  field: { fieldApiName: name, fieldIndex: index }, operator: '=', value: `'${value}'`,
  sqlString: `${name} = '${value}'`,
});
function query(): QueryState {
  return { indexCurrentElement: 0, queryElemnts: [
    { type: 'ROOT', parent: -1, level: 0, limit: 50, sObjectId: object('Contact', 0),
      selectClause: { fields: [selected('Id')] } },
    { type: 'RELETED', parent: 0, level: 1, path: 'Account.', relatedTo: 'Account',
      sObjectId: object('Account', 1), selectClause: { fields: [] } },
    { type: 'RELETED', parent: 1, level: 2, path: 'Account.Owner.', relatedTo: 'Owner',
      sObjectId: object('User', 2), selectClause: { fields: [] } },
    { type: 'SUBQUERY', parent: 0, level: 1, limit: 50, relationshipName: 'Cases',
      sObjectId: object('Case', 3), selectClause: { fields: [selected('Id')] } },
    { type: 'RELETED', parent: 3, level: 2, path: 'Account.', relatedTo: 'Account',
      sObjectId: object('Account', 1), selectClause: { fields: [] } },
  ] };
}

afterEach(() => { cleanup(); jest.restoreAllMocks(); });

test('resolves the nearest query block and rejects corrupt ancestry', () => {
  const state = query();
  expect(whereOwner(state, 0)).toEqual({ ownerIndex: 0, relationshipPath: [] });
  expect(whereOwner(state, 2)).toEqual({ ownerIndex: 0, relationshipPath: ['Account', 'Owner'] });
  expect(whereOwner(state, 4)).toEqual({ ownerIndex: 3, relationshipPath: ['Account'] });
  state.queryElemnts[2].parent = 2;
  expect(() => whereOwner(state, 2)).toThrow('Árbol de consulta no válido');
  state.queryElemnts[2].parent = 99;
  expect(() => whereOwner(state, 2)).toThrow('Árbol de consulta no válido');
});

test('mixes local and chained parent conditions under one root WHERE with custom logic', () => {
  modelState.setState({ queryState: query() });
  modelState.getState().addWhere(condition('LastName', 1, 'Soto'));
  modelState.setState({ queryState: { ...modelState.getState().queryState, indexCurrentElement: 1 } });
  modelState.getState().addWhere(condition('Account.Industry', 2, 'Tech'));
  modelState.setState({ queryState: { ...modelState.getState().queryState, indexCurrentElement: 2 } });
  modelState.getState().addWhere(condition('Account.Owner.Name', 3, 'Ana'));
  modelState.getState().setWhereLogic(2, '(C1 OR C2) AND C3');
  const root = modelState.getState().queryState.queryElemnts[0] as PrimaryQuery;
  expect(root.where?.map(item => item.field)).toEqual([
    { fieldApiName: 'LastName', fieldIndex: 1, relationshipPath: [] },
    { fieldApiName: 'Industry', fieldIndex: 2, relationshipPath: ['Account'] },
    { fieldApiName: 'Name', fieldIndex: 3, relationshipPath: ['Account', 'Owner'] },
  ]);
  expect('where' in modelState.getState().queryState.queryElemnts[1]).toBe(false);
  expect(root.whereLogic).toBe('(C1 OR C2) AND C3');
  expect(modelState.getState().sqlState.sql).toContain(
    "WHERE ((LastName = 'Soto' OR Account.Industry = 'Tech') AND Account.Owner.Name = 'Ana')");
  expect((modelState.getState().sqlState.sql.match(/ WHERE /g) ?? [])).toHaveLength(1);
  modelState.getState().addWhere(condition('Account.Owner.Email', 4, 'a@example.com'));
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).whereLogic)
    .toBe('((C1 OR C2) AND C3) AND C4');
});

test('keeps a related condition below a child query inside that child WHERE', () => {
  const state = query();
  state.indexCurrentElement = 3;
  modelState.setState({ queryState: state });
  modelState.getState().addWhere(condition('Status', 1, 'New'));
  modelState.setState({ queryState: { ...modelState.getState().queryState, indexCurrentElement: 4 } });
  modelState.getState().addWhere(condition('Account.Industry', 2, 'Tech'));
  modelState.getState().setWhereLogic(4, 'C1 OR C2');
  const current = modelState.getState();
  expect((current.queryState.queryElemnts[0] as PrimaryQuery).where).toBeUndefined();
  expect((current.queryState.queryElemnts[3] as NestedQuery).whereLogic).toBe('C1 OR C2');
  expect(current.sqlState.sql).toContain("FROM Cases WHERE (Status = 'New' OR Account.Industry = 'Tech')");
  expect(current.sqlState.sql).not.toContain('FROM Contact WHERE');
});

test('shows one editor per query block and qualified paths for related conditions', () => {
  const state = query();
  (state.queryElemnts[0] as PrimaryQuery).where = [
    condition('LastName', 1, 'Soto'),
    { ...condition('Industry', 2, 'Tech'), field: { fieldApiName: 'Industry', fieldIndex: 2,
      relationshipPath: ['Account'] } },
  ];
  (state.queryElemnts[0] as PrimaryQuery).whereLogic = 'C1 OR C2';
  (state.queryElemnts[3] as NestedQuery).where = [condition('Status', 1, 'New')];
  modelState.setState({ queryState: state });
  render(<WhereClausePanel />);
  expect(screen.getAllByRole('textbox')).toHaveLength(2);
  expect(screen.getAllByText('C1')).toHaveLength(2);
  expect(screen.getByText('C2')).toBeInTheDocument();
  expect(screen.getByText('(Account.Industry)')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Lógica WHERE de User/ })).not.toBeInTheDocument();
  const rootInput = screen.getByRole('textbox', { name: 'Lógica WHERE de Contact' });
  expect(rootInput).toHaveValue('C1 OR C2');
  fireEvent.change(rootInput, { target: { value: '(C1 AND C2)' } });
  fireEvent.click(within(rootInput.closest('form')!).getByRole('button', { name: 'Aplicar lógica' }));
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).whereLogic).toBe('(C1 AND C2)');
});

test('marks WHERE fields only on the object matching their relationship path', () => {
  const state = query();
  (state.queryElemnts[0] as PrimaryQuery).where = [{ ...condition('Industry', 0, 'Tech'),
    field: { fieldApiName: 'Industry', fieldIndex: 0, relationshipPath: ['Account'] } }];
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [{ fieldLocalId: 0, name: 'Id' }] } as SObject);
  modelState.setState({ queryState: state });
  modelState.getState().showByqueryElemntsIndex(0);
  expect(modelState.getState().currentSOQLFieldSelection.get(0)?.isWhere).toBe(false);
  modelState.getState().showByqueryElemntsIndex(1);
  expect(modelState.getState().currentSOQLFieldSelection.get(0)?.isWhere).toBe(true);
});
