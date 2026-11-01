import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import WhereBuilder from '../src/components/organisms/fieldDialog/whereBuilder/whereBuilder';
import { RetroRangeInput } from '../src/components/atoms/RetroStyle/Input/RetroInput';
import { buildWhereCondition, type WhereDraft } from '../src/core/soql/whereDraft';
import { dateLiterals, isSupportedDateLiteral } from '../src/core/soql/dateLiterals';
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

test('text matching choices produce safe SOQL LIKE patterns', () => {
  expect(buildWhereCondition(draft({ operator: 'CONTAINS', from: 'Ada' })).sqlString).toBe("Name LIKE '%Ada%'");
  expect(buildWhereCondition(draft({ operator: 'STARTS_WITH', from: 'Ada' })).sqlString).toBe("Name LIKE 'Ada%'");
  expect(buildWhereCondition(draft({ operator: 'ENDS_WITH', from: 'Ada' })).sqlString).toBe("Name LIKE '%Ada'");
  expect(buildWhereCondition(draft({ operator: 'CONTAINS', from: "A%_\\'" })).sqlString)
    .toBe("Name LIKE '%A\\%\\_\\\\\\'%'");
  expect(() => buildWhereCondition(draft({ operator: 'CONTAINS', from: '' }))).toThrow();
  expect(() => buildWhereCondition(draft({ kind: 'number', operator: 'CONTAINS', from: '2' }))).toThrow();
  const apply = jest.fn();
  render(<WhereBuilder field={field} path="" applyNewCondition={apply} />);
  const condition = screen.getByRole('combobox', { name: 'Condition' });
  expect(screen.queryByRole('option', { name: 'LIKE' })).not.toBeInTheDocument();
  fireEvent.change(condition, { target: { value: 'ENDS_WITH' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Value' }), { target: { value: 'Ada' } });
  expect(screen.getByText("Name LIKE '%Ada'")).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(apply).toHaveBeenCalledWith(expect.objectContaining({ operator: 'LIKE' }));
});

test('every date literal offered by the editor is accepted by the builder and SOQL validator', () => {
  for (const definition of dateLiterals) {
    const value = definition.count ? `${definition.code}:30` : definition.code;
    expect(isSupportedDateLiteral(value)).toBe(true);
    expect(buildWhereCondition(draft({ kind: 'date', mode: 'literal', dateLiteral: value })).sqlString)
      .toBe(`Name = ${value}`);
    expect(buildWhereCondition(draft({ kind: 'datetime', mode: 'literal', dateLiteral: value })).sqlString)
      .toBe(`Name = ${value}`);
  }
  for (const invalid of ['NEXT_N_YEARS', 'LAST_N_DAYS:0', 'LAST_N_DAYS:1000',
    'LAST_N_DAYS:-1', 'TODAY:1', 'NEXT_N_DAYS:1:2', 'ACUSTOM_YEAR']) {
    expect(isSupportedDateLiteral(invalid)).toBe(false);
    expect(() => buildWhereCondition(draft({ kind: 'date', mode: 'literal', dateLiteral: invalid }))).toThrow();
  }
});

test.each(['date', 'datetime'] as const)('%s editor explains date literals, parameters and fiscal periods', kind => {
  const apply = jest.fn();
  const dateField = { ...field, fieldApiName: 'CreatedDate', type: kind } as GetFieldsIndex;
  render(<WhereBuilder field={dateField} path="" applyNewCondition={apply} />);
  expect(screen.getByRole('combobox', { name: 'Value type' })).toHaveValue('literal');
  expect(screen.getByText('CreatedDate = TODAY')).toBeInTheDocument();
  expect(screen.getByText('The current calendar day.')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Relative date' }), { target: { value: 'LAST_N_DAYS' } });
  expect(screen.getByRole('spinbutton', { name: 'Number of periods' })).toHaveValue(1);
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Number of periods' }), { target: { value: '30' } });
  expect(screen.getByText('Today and the previous 30 days.')).toBeInTheDocument();
  expect(screen.getByText('CreatedDate = LAST_N_DAYS:30')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Number of periods' }), { target: { value: '0' } });
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Number of periods' }), { target: { value: '30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Fiscal quarter' }));
  expect(screen.getByText("Fiscal periods follow the connected organization's fiscal calendar.")).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Relative date' }), { target: { value: 'NEXT_N_FISCAL_QUARTERS' } });
  expect(screen.getByText('CreatedDate = NEXT_N_FISCAL_QUARTERS:1')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(apply).toHaveBeenCalledWith(expect.objectContaining({ sqlString: 'CreatedDate = NEXT_N_FISCAL_QUARTERS:1' }));
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
  expect(screen.getByText('Enter a value before applying the condition.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  expect(apply).not.toHaveBeenCalled();
});

test('picklist buttons work with keyboard and Not In matches the stored operator', () => {
  const apply = jest.fn();
  const picklist = { ...field, type: 'picklist', picklistValues: [{ value: 'Gold', label: 'Gold' }] } as unknown as GetFieldsIndex;
  render(<WhereBuilder field={picklist} path="" applyNewCondition={apply} />);
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
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
