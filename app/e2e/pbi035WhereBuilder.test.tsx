import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import WhereBuilder from '../src/components/organisms/fieldDialog/whereBuilder/whereBuilder';
import { RetroRangeInput } from '../src/components/atoms/RetroStyle/Input/RetroInput';
import { buildWhereCondition, type WhereDraft } from '../src/core/soql/whereDraft';
import { legacyConditionToPredicate, legacyQueryToAst } from '../src/core/soql/legacyAdapter';
import { renderPredicate } from '../src/core/soql/domain';
import modelState from '../src/store/modelState';

globalThis.structuredClone ??= <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const orgKey = '00D000000000001:005000000000001';
const field = { fieldApiName: 'Name', fieldLocalId: 0, type: 'string', picklistValues: [] } as unknown as GetFieldsIndex;
function draft(partial: Partial<WhereDraft> = {}): WhereDraft {
  return { field: { fieldApiName: 'Name', fieldIndex: 0 }, kind: 'text', mode: 'single',
    operator: '=', from: 'Ada', to: '', values: [], dateLiteral: 'TODAY', ...partial };
}
afterEach(() => cleanup());

test('range controls report the current endpoint without copying it', () => {
  const change = jest.fn();
  render(<RetroRangeInput type="text" labelFrom="From" labelTo="To" onChangeRangeValue={change} />);
  fireEvent.change(screen.getByRole('textbox', { name: 'From' }), { target: { value: 'A' } });
  expect(change).toHaveBeenLastCalledWith({ typeHTML: 'text', from: 'A', to: '' });
  fireEvent.change(screen.getByRole('textbox', { name: 'To' }), { target: { value: 'Z' } });
  expect(change).toHaveBeenLastCalledWith({ typeHTML: 'text', from: 'A', to: 'Z' });
});

test('typed predicates render ranges, NULL, booleans, lists and dates consistently', () => {
  const range = buildWhereCondition(draft({ mode: 'range', operator: '!=', from: 'A', to: 'Z' }));
  expect(range.sqlString).toBe("(Name < 'A' OR Name > 'Z')");
  expect(renderPredicate(legacyConditionToPredicate(range))).toBe(range.sqlString);
  const number = buildWhereCondition(draft({ kind: 'number', mode: 'range', operator: '=', from: '2', to: '10' }));
  expect(number.sqlString).toBe('(Name >= 2 AND Name <= 10)');
  expect(buildWhereCondition(draft({ mode: 'null', from: '', operator: '!=' })).sqlString).toBe('Name != NULL');
  expect(buildWhereCondition(draft({ kind: 'boolean', from: 'false' })).sqlString).toBe('Name = FALSE');
  expect(buildWhereCondition(draft({ kind: 'picklist', mode: 'list', operator: 'NOT IN', values: ['Gold'] })).sqlString)
    .toBe("Name NOT IN ('Gold')");
  expect(buildWhereCondition(draft({ kind: 'multiselect', mode: 'list', operator: 'INCLUDES', values: ['Gold'] })).sqlString)
    .toBe("Name INCLUDES ('Gold')");
  expect(buildWhereCondition(draft({ kind: 'date', from: '2026-01-15' })).sqlString).toBe('Name = 2026-01-15');
  expect(buildWhereCondition(draft({ kind: 'datetime', from: '2026-01-15T12:30:00Z' })).sqlString)
    .toBe('Name = 2026-01-15T12:30:00Z');
  expect(buildWhereCondition(draft({ kind: 'date', mode: 'literal', dateLiteral: 'TODAY' })).sqlString)
    .toBe('Name = TODAY');
});

test('incomplete or unsupported drafts are rejected without a preview or mutation', () => {
  for (const invalid of [
    { mode: 'range' as const, from: 'A', to: '' },
    { mode: 'list' as const, operator: 'IN', values: [] },
    { kind: 'date' as const, mode: 'literal' as const, dateLiteral: 'NEXT_N_YEARS' },
    { kind: 'datetime' as const, from: '2026-01-15T12:30' },
    { kind: 'number' as const, mode: 'range' as const, from: '10', to: '2' },
    { kind: 'date' as const, from: '2026-02-30' },
  ]) expect(() => buildWhereCondition(draft(invalid))).toThrow();
  const apply = jest.fn();
  render(<WhereBuilder field={field} path="" applyNewCondition={apply} />);
  expect(screen.getByText('Complete the condition to see a preview.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a value');
  expect(apply).not.toHaveBeenCalled();
});

test('picklist buttons work with keyboard and Not In matches the stored operator', () => {
  const apply = jest.fn();
  const picklist = { ...field, type: 'picklist', picklistValues: [{ value: 'Gold', label: 'Gold' }] } as unknown as GetFieldsIndex;
  render(<WhereBuilder field={picklist} path="" applyNewCondition={apply} />);
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(apply).not.toHaveBeenCalled();
  const value = screen.getByRole('button', { name: 'Gold' });
  value.focus();
  fireEvent.keyDown(value, { key: 'Enter' });
  fireEvent.click(value);
  expect(screen.getByRole('checkbox', { name: /Not In/ })).not.toBeChecked();
  expect(screen.getByText("Name IN ('Gold')")).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: /Not In/ }));
  expect(screen.getByText("Name NOT IN ('Gold')")).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(apply.mock.calls[0][0].operator).toBe('NOT IN');
});

test('a related condition joins its owner WHERE while the child stays separate', () => {
  const id = { fieldId: { fieldApiName: 'Id', fieldIndex: 0 }, soqlFunction: '%1',
    isAggregateFunction: false, makeGroupBy: false };
  const query: QueryState = { indexCurrentElement: 1, queryElemnts: [
    { type: 'ROOT', parent: -1, level: 0, sObjectId: { orgSfName: orgKey, sObjectApiName: 'Contact', sObjectLocalId: 0 },
      selectClause: { fields: [id] } },
    { type: 'RELETED', parent: 0, level: 1, path: 'Account.', relatedTo: 'Account',
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Account', sObjectLocalId: 1 },
      selectClause: { fields: [] } },
    { type: 'SUBQUERY', parent: 0, level: 1, relationshipName: 'Cases',
      sObjectId: { orgSfName: orgKey, sObjectApiName: 'Case', sObjectLocalId: 2 },
      selectClause: { fields: [id] } },
  ] };
  modelState.setState({ queryState: query, state: { ...modelState.getState().state, orgSfName: orgKey },
    currentSOQLFieldSelection: new Map() });
  modelState.getState().addWhere(buildWhereCondition(draft({ field: { fieldApiName: 'Account.Name', fieldIndex: 0 } })));
  const result = modelState.getState().queryState;
  expect((result.queryElemnts[0] as PrimaryQuery).whereLogic).toBe('C1');
  expect((result.queryElemnts[2] as NestedQuery).where).toBeUndefined();
  expect(modelState.getState().sqlState.sql).toContain("WHERE Account.Name = 'Ada'");
  expect(JSON.stringify(legacyQueryToAst(result))).toContain('Account.Name');
});
