import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import FieldDialog from '../src/components/organisms/fieldDialog/fieldDialog';
import { fieldCapabilities, fieldEditorContext, selectedFunctions } from '../src/core/soql/fieldEditor';
import { legacyQueryToAst } from '../src/core/soql/legacyAdapter';
import { validateQuery } from '../src/core/soql/domain';
import { modelReader } from '../src/services/salesforceSchema/proxy';
import modelState from '../src/store/modelState';
import constants from '../src/components/constants';

globalThis.structuredClone ??= <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const orgKey = '00D000000000001:005000000000001';
const dateField = { fieldLocalId: 0, fieldApiName: 'CreatedDate', type: 'datetime' } as GetFieldsIndex;
const relatedField = { fieldLocalId: 0, fieldApiName: 'Name', type: 'string' } as GetFieldsIndex;
const root = { type: 'ROOT' as const, parent: -1, level: 0, limit: 50,
  sObjectId: { orgSfName: orgKey, sObjectApiName: 'Account', sObjectLocalId: 0 },
  selectClause: { fields: [] as SelectClauseField[] } };
function setup() {
  jest.spyOn(modelReader, 'getFieldApiName').mockImplementation((_org, objectId) => objectId === 1 ? 'Name' : 'CreatedDate');
  jest.spyOn(modelReader, 'getSObject').mockImplementation((_org, objectId) => ({
    fields: [objectId === 1 ? relatedField : dateField],
  } as unknown as SObject));
  modelState.setState({ state: { ...modelState.getState().state, orgSfName: orgKey,
    currentField: dateField, currentPath: '', action: 'field' },
    queryState: { indexCurrentElement: 0, queryElemnts: [structuredClone(root)] },
    currentSOQLFieldSelection: new Map() });
}
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

test('selecting two expressions and removing one preserves the other and rejects duplicates', () => {
  setup();
  const state = modelState.getState();
  state.doFieldAction(0, constants.SELECTED, 'MIN(%1)', true, false);
  state.doFieldAction(0, constants.SELECTED, 'MAX(%1)', true, false);
  state.doFieldAction(0, constants.SELECTED, 'MAX(%1)', true, false);
  expect(modelState.getState().queryState.queryElemnts[0].selectClause.fields).toHaveLength(2);
  render(<FieldDialog />);
  fireEvent.click(screen.getByText('Select'));
  expect(screen.getByRole('checkbox', { name: /Minimum/i })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /Maximum/i })).toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: /Minimum/i }));
  expect(screen.getByRole('checkbox', { name: /Maximum/i })).toBeChecked();
  expect(modelState.getState().queryState.queryElemnts[0].selectClause.fields.map(item => item.soqlFunction))
    .toEqual(['MAX(%1)']);
  expect(modelState.getState().sqlState.sql).toContain('MAX(CreatedDate)');
});

test('root, related and child contexts isolate the same local field index', () => {
  setup();
  const state = modelState.getState();
  state.doFieldAction(0, constants.SELECTED, '%1');
  const related = { type: 'RELETED' as const, parent: 0, level: 1, path: 'Owner.', relatedTo: 'Owner',
    sObjectId: { orgSfName: orgKey, sObjectApiName: 'User', sObjectLocalId: 1 },
    selectClause: { fields: [] as SelectClauseField[] } };
  const child = { type: 'SUBQUERY' as const, parent: 0, level: 1, relationshipName: 'Contacts', limit: 1,
    sObjectId: { orgSfName: orgKey, sObjectApiName: 'Contact', sObjectLocalId: 2 },
    selectClause: { fields: [] as SelectClauseField[] } };
  modelState.setState({ queryState: { indexCurrentElement: 1,
    queryElemnts: [modelState.getState().queryState.queryElemnts[0], related, child] },
    state: { ...modelState.getState().state, currentField: relatedField, currentPath: 'Owner.' },
    currentSOQLFieldSelection: new Map() });
  expect(() => render(<FieldDialog />)).not.toThrow();
  state.doFieldAction(0, constants.SELECTED, '%1');
  let query = modelState.getState().queryState;
  const context = fieldEditorContext(query, 1, relatedField);
  expect(context).toMatchObject({ orgKey, ownerIndex: 0, relationshipPath: ['Owner'], fieldApiName: 'Name' });
  expect(selectedFunctions(query, context)).toEqual(['%1']);
  expect(JSON.stringify(legacyQueryToAst(query))).toContain('Owner.Name');
  modelState.getState().showByqueryElemntsIndex(2);
  modelState.getState().setField(dateField);
  expect(() => render(<FieldDialog />)).not.toThrow();
  state.doFieldAction(0, constants.SELECTED, '%1');
  query = modelState.getState().queryState;
  expect(query.queryElemnts.map(item => item.selectClause.fields.length)).toEqual([1, 1, 1]);
  expect(fieldEditorContext(query, 2, dateField).ownerIndex).toBe(2);
  expect(modelState.getState().sqlState.sql).toContain('Owner.Name');
});

test('aggregate validation uses the owner block and preserves state on failure', () => {
  setup();
  modelState.getState().doFieldAction(0, constants.SELECTED, '%1');
  const before = modelState.getState().queryState;
  expect(() => modelState.getState().doFieldAction(0, constants.SELECTED, 'MIN(%1)', true))
    .toThrow('Group plain fields');
  expect(modelState.getState().queryState).toBe(before);
  modelState.getState().doFieldAction(0, constants.UNSELECTED, '%1');
  modelState.getState().doFieldAction(0, constants.SELECTED, 'CALENDAR_YEAR(%1)', false, true);
  modelState.getState().doFieldAction(0, constants.SELECTED, 'MIN(%1)', true);
  const ast = legacyQueryToAst(modelState.getState().queryState);
  expect(ast && validateQuery(ast)).toEqual([]);
});

test('visible SELECT functions are supported by the AST and unsupported types retain SELECT access', () => {
  expect(fieldCapabilities('datetime').select.map(item => item.keyWord)).not.toContain('convertTimezone(%1)');
  expect(fieldCapabilities('encryptedText').select).toEqual([]);
  setup();
  modelState.setState({ state: { ...modelState.getState().state,
    currentField: { ...dateField, type: 'encryptedText' } } });
  render(<FieldDialog />);
  expect(screen.getByText('No SELECT expressions are available for this field type.')).toBeInTheDocument();
});

test('string fields show supported aggregate choices and render a usable query', () => {
  setup();
  const textField = { fieldLocalId: 0, fieldApiName: 'Name', type: 'string' } as GetFieldsIndex;
  jest.spyOn(modelReader, 'getFieldApiName').mockReturnValue('Name');
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [textField] } as unknown as SObject);
  modelState.setState({ state: { ...modelState.getState().state, currentField: textField } });
  expect(fieldCapabilities('string').select.map(item => item.keyWord)).toEqual([
    '%1', '%1 ', 'COUNT(%1)', 'COUNT_DISTINCT(%1)', 'MIN(%1)', 'MAX(%1)',
  ]);
  render(<FieldDialog />);
  expect(screen.getByRole('group', { name: 'Aggregate and grouped expressions' })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /Count fields/i })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /Count Distinct/i })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /Minimum/i })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /Maximum/i })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /Group by/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: /Count Distinct/i }));
  expect(modelState.getState().sqlState.sql).toBe('SELECT COUNT_DISTINCT(Name) FROM Account');
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).limit).toBeUndefined();
});

test('string Group by can combine with a string aggregate and keeps an explicit limit', () => {
  setup();
  const textField = { fieldLocalId: 0, fieldApiName: 'Name', type: 'string' } as GetFieldsIndex;
  jest.spyOn(modelReader, 'getFieldApiName').mockReturnValue('Name');
  jest.spyOn(modelReader, 'getSObject').mockReturnValue({ fields: [textField] } as unknown as SObject);
  modelState.setState({ state: { ...modelState.getState().state, currentField: textField } });
  render(<FieldDialog />);
  fireEvent.click(screen.getByRole('checkbox', { name: /Group by/i }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Count fields/i }));
  expect(modelState.getState().sqlState.sql).toBe('SELECT Name, COUNT(Name) FROM Account GROUP BY Name LIMIT 50');
});

test('the mounted editor follows the current field without keeping stale selections', () => {
  setup();
  modelState.getState().doFieldAction(0, constants.SELECTED, 'MIN(%1)', true);
  render(<FieldDialog />);
  fireEvent.click(screen.getByText('Select'));
  expect(screen.getByRole('checkbox', { name: /Minimum/i })).toBeChecked();
  act(() => modelState.setState({ state: { ...modelState.getState().state,
    currentField: { ...dateField, fieldLocalId: 1, fieldApiName: 'OtherDate' } } }));
  expect(screen.getByRole('checkbox', { name: /Minimum/i })).not.toBeChecked();
});
