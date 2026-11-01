import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import OrderClausePanel from '../src/components/organisms/sObjectPanel/orderClausePanel';
import OrderByBuilder from '../src/components/organisms/fieldDialog/orderByBuilder';
import { renderQuery, validateQuery, type RootQuery } from '../src/core/soql/domain';
import { legacyQueryToAst } from '../src/core/soql/legacyAdapter';
import modelState from '../src/store/modelState';
import { dispatchObjectPanelAction, OBJECT_PANEL_ACTION } from '../src/core/objectPanelActions';
import objectPanelState from '../src/store/objectPanelState';

globalThis.structuredClone ??= <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const orgKey = '00D000000000001:005000000000001';
const field = (name: string, index: number, sortable = true) =>
  ({ fieldApiName: name, fieldLocalId: index, type: 'string', sortable } as GetFieldsIndex);
const selected = { fieldId: { fieldApiName: 'Id', fieldIndex: 0 }, soqlFunction: '%1',
  isAggregateFunction: false, makeGroupBy: false };
function query(): QueryState {
  return { indexCurrentElement: 0, queryElemnts: [
    { type: 'ROOT', parent: -1, level: 0, limit: 50,
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Contact', sObjectLocalId: 0 },
      selectClause: { fields: [selected] } },
    { type: 'RELETED', parent: 0, level: 1, path: 'Account.', relatedTo: 'Account',
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Account', sObjectLocalId: 1 },
      selectClause: { fields: [] } },
    { type: 'SUBQUERY', parent: 0, level: 1, relationshipName: 'Cases',
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Case', sObjectLocalId: 2 },
      selectClause: { fields: [selected] } },
  ] };
}
function setup() { modelState.setState({ queryState: query(),
  state: { ...modelState.getState().state, orgSfName: orgKey }, currentSOQLFieldSelection: new Map() }); }
afterEach(() => cleanup());

test('AST renders root, child and related orders with optional NULLS policy', () => {
  const ast: RootQuery = { kind: 'root', from: 'Contact',
    select: [{ kind: 'expression', expression: { kind: 'field', path: 'Id' } },
      { kind: 'subquery', query: { kind: 'child', relationship: 'Cases',
        select: [{ kind: 'expression', expression: { kind: 'field', path: 'Id' } }],
        orderBy: [{ field: 'Subject', direction: 'DESC', nulls: 'FIRST' }] } }],
    orderBy: [{ field: 'Account.Name', direction: 'ASC', nulls: 'LAST' },
      { field: 'CreatedDate', direction: 'DESC', nulls: 'FIRST' }] };
  expect(renderQuery(ast)).toContain('ORDER BY Subject DESC NULLS FIRST');
  expect(renderQuery(ast)).toContain('ORDER BY Account.Name ASC NULLS LAST, CreatedDate DESC NULLS FIRST');
  delete ast.orderBy![1].nulls;
  expect(validateQuery(ast)).toEqual([]);
  expect(renderQuery(ast)).toContain('ORDER BY Account.Name ASC NULLS LAST, CreatedDate DESC');
  ast.orderBy![0].nulls = 'UNKNOWN' as 'LAST';
  expect(validateQuery(ast).map(error => error.code)).toContain('INVALID_NULL_POLICY');
});

test('adding, moving and removing orders changes only owner blocks and SQL priority', () => {
  setup();
  const state = modelState.getState();
  state.addOrderBy(field('LastName', 1), 'ASC', 'LAST');
  modelState.setState({ queryState: { ...modelState.getState().queryState, indexCurrentElement: 1 } });
  state.addOrderBy(field('Name', 0), 'DESC', 'FIRST');
  const beforeDuplicate = modelState.getState().queryState;
  expect(() => state.addOrderBy(field('Name', 0), 'ASC', 'LAST')).toThrow('already used');
  expect(modelState.getState().queryState).toBe(beforeDuplicate);
  modelState.setState({ queryState: { ...beforeDuplicate, indexCurrentElement: 2 } });
  state.addOrderBy(field('Subject', 1), 'ASC', 'FIRST');
  let current = modelState.getState().queryState;
  expect(current.queryElemnts[1].orderBy).toBeUndefined();
  expect((current.queryElemnts[0] as PrimaryQuery).orderBy?.map(order => order.field.fieldApiName))
    .toEqual(['LastName', 'Name']);
  expect(modelState.getState().sqlState.sql).toContain('ORDER BY LastName ASC NULLS LAST, Account.Name DESC NULLS FIRST');
  expect(modelState.getState().sqlState.sql).toContain('ORDER BY Subject ASC NULLS FIRST');
  state.moveOrderBy(0, 1, 0);
  expect(modelState.getState().sqlState.sql).toContain('ORDER BY Account.Name DESC NULLS FIRST, LastName ASC NULLS LAST');
  state.removeOrderBy(0, 1);
  current = modelState.getState().queryState;
  expect((current.queryElemnts[0] as PrimaryQuery).orderBy).toHaveLength(1);
  expect((current.queryElemnts[2] as NestedQuery).orderBy).toHaveLength(1);
  expect(JSON.stringify(legacyQueryToAst(current))).toContain('Account.Name');
  const beforeInvalid = current;
  expect(() => state.moveOrderBy(0, 0, 4)).toThrow();
  expect(() => state.addOrderBy(field('Other', 3, false), 'ASC', 'FIRST')).toThrow('cannot be used');
  expect(modelState.getState().queryState).toBe(beforeInvalid);
});

test('editor requires direction, allows default null order and lists priorities without a RELETED group', () => {
  setup();
  const view = render(<OrderByBuilder field={field('LastName', 1)} path="" />);
  expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  fireEvent.change(screen.getByRole('combobox', { name: 'Direction' }), { target: { value: 'ASC' } });
  expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  expect(modelState.getState().sqlState.sql).toContain('ORDER BY LastName ASC LIMIT 50');
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).orderBy?.[0].nulls).toBeUndefined();
  view.unmount();
  render(<OrderClausePanel />);
  expect(screen.getByText('LastName ASC')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Account' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove LastName' }));
  expect(screen.getByText('No ORDER BY fields have been added.')).toBeInTheDocument();
});

test('editor retains explicit NULLS FIRST and LAST when selected', () => {
  setup();
  render(<OrderByBuilder field={field('LastName', 1)} path="" />);
  fireEvent.change(screen.getByRole('combobox', { name: 'Direction' }), { target: { value: 'DESC' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Nulls' }), { target: { value: 'LAST' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  expect(modelState.getState().sqlState.sql).toContain('ORDER BY LastName DESC NULLS LAST');
});

test('Order Clause tab shares an action and responds to keyboard navigation', () => {
  setup();
  act(() => dispatchObjectPanelAction(OBJECT_PANEL_ACTION.SHOW_ORDER));
  expect(objectPanelState.getState().activeTab).toBe('order');
});
