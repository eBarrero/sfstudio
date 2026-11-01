import { defaultWhereLogic, parseWhereLogic, WhereLogicError } from '../src/core/soql/whereLogic';
import modelState from '../src/store/modelState';

globalThis.structuredClone ??= <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const condition = (name: string, index: number): SimpleCondition => ({
  field: { fieldApiName: name, fieldIndex: index }, operator: '=',
  value: `'${name}'`, sqlString: `${name} = '${name}'`,
});
const queryState = (): QueryState => ({ indexCurrentElement: 0, queryElemnts: [{
  type: 'ROOT', parent: -1, level: 0, limit: 50,
  sObjectId: { orgSfName: 'fixture', sObjectApiName: 'Account', sObjectLocalId: 0 },
  selectClause: { fields: [{ fieldId: { fieldApiName: 'Name', fieldIndex: 0 },
    isAggregateFunction: false, makeGroupBy: false, soqlFunction: '%1' }] },
}] });

test('builds the default AND expression as conditions are added', () => {
  expect(defaultWhereLogic(1)).toBe('C1');
  expect(defaultWhereLogic(3)).toBe('C1 AND C2 AND C3');
});

test('parses grouped AND/OR with one-based condition references', () => {
  expect(parseWhereLogic('(C1 and C2) OR C3', 3)).toEqual({
    kind: 'OR',
    left: { kind: 'AND', left: { kind: 'condition', index: 0 },
      right: { kind: 'condition', index: 1 } },
    right: { kind: 'condition', index: 2 },
  });
  expect(parseWhereLogic('C1 OR C2 AND C3', 3)).toEqual({
    kind: 'OR', left: { kind: 'condition', index: 0 },
    right: { kind: 'AND', left: { kind: 'condition', index: 1 },
      right: { kind: 'condition', index: 2 } },
  });
});

test.each(['C0', 'C4', 'C99999999999999999999'])(
  'rejects an out-of-range reference %s', expression => {
    expect(() => parseWhereLogic(expression, 3)).toThrow(WhereLogicError);
    try { parseWhereLogic(expression, 3); }
    catch (error) { expect((error as WhereLogicError).code).toBe('INDEX_OUT_OF_RANGE'); }
  },
);

test.each(['(C1 AND C2', 'C1 AND C2)', ')(C1', 'C1 OR', 'C1 C2', 'C1 XOR C2', '()', 'C1 AND ()'])(
  'rejects malformed grouping or operators: %s', expression => {
    expect(() => parseWhereLogic(expression, 2)).toThrow(WhereLogicError);
  },
);

test('the model builds defaults, applies grouped OR and preserves it when a condition is added', () => {
  modelState.setState({ queryState: queryState() });
  modelState.getState().addWhere(condition('Name', 0));
  modelState.getState().addWhere(condition('Industry', 1));
  modelState.getState().addWhere(condition('Type', 2));
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).whereLogic).toBe('C1 AND C2 AND C3');

  modelState.getState().setWhereLogic(0, '(C1 AND C2) OR C3');
  expect(modelState.getState().sqlState.sql).toContain(
    "WHERE ((Name = 'Name' AND Industry = 'Industry') OR Type = 'Type')");
  const before = modelState.getState().queryState;
  expect(() => modelState.getState().setWhereLogic(0, '(C1 OR C4)')).toThrow(WhereLogicError);
  expect(modelState.getState().queryState).toBe(before);

  modelState.getState().addWhere(condition('OwnerId', 3));
  expect((modelState.getState().queryState.queryElemnts[0] as PrimaryQuery).whereLogic)
    .toBe('((C1 AND C2) OR C3) AND C4');
});

test('each query element keeps its own WHERE logic', () => {
  const state = queryState();
  (state.queryElemnts[0] as PrimaryQuery).where = [condition('Name', 0), condition('Industry', 1)];
  (state.queryElemnts[0] as PrimaryQuery).whereLogic = 'C1 AND C2';
  state.queryElemnts.push({
    type: 'SUBQUERY', parent: 0, level: 1, limit: 50, relationshipName: 'Contacts',
    sObjectId: { orgSfName: 'fixture', sObjectApiName: 'Contact', sObjectLocalId: 1 },
    selectClause: { fields: [{ fieldId: { fieldApiName: 'Email', fieldIndex: 0 },
      isAggregateFunction: false, makeGroupBy: false, soqlFunction: '%1' }] },
    where: [condition('Email', 0), condition('LastName', 1)], whereLogic: 'C1 AND C2',
  });
  modelState.setState({ queryState: state });
  modelState.getState().setWhereLogic(1, 'C1 OR C2');
  const current = modelState.getState();
  expect((current.queryState.queryElemnts[0] as PrimaryQuery).whereLogic).toBe('C1 AND C2');
  expect((current.queryState.queryElemnts[1] as NestedQuery).whereLogic).toBe('C1 OR C2');
  expect(current.sqlState.sql).toContain(
    "FROM Contacts WHERE (Email = 'Email' OR LastName = 'LastName')");
  expect(current.sqlState.sql).toContain(
    "FROM Account WHERE (Name = 'Name' AND Industry = 'Industry')");
});
