import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';
import SOQLPath from '../src/components/organisms/SOQLPath/soqlPath';
import modelState from '../src/store/modelState';
import { legacyQueryToAst } from '../src/core/soql/legacyAdapter';
import { validateQuery } from '../src/core/soql/domain';

const queryElement = (index: number, level: number, parent: number, name: string): QueryElement => {
  const base = {
  sObjectId: { orgSfName: 'fixture-org', sObjectLocalId: index, sObjectApiName: name },
  parent,
  level,
  selectClause: { fields: [] },
  };
  return index === 0 ? { ...base, type: 'ROOT', limit: 50 } :
    { ...base, type: 'RELETED', relatedTo: name, path: '' };
};

beforeAll(() => {
  function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
  globalThis.structuredClone ??= clone;
});
afterEach(cleanup);

it('indents by tree depth, including a two-digit element index', () => {
  const elements = Array.from({ length: 11 }, (_, index) =>
    queryElement(index, index === 0 ? 0 : 1, index === 0 ? -1 : 0, `Element${index}`));
  elements[0] = queryElement(0, 0, -1, 'Root');
  elements[1] = queryElement(1, 1, 0, 'Child');
  elements[2] = queryElement(2, 1, 1, 'Grandchild');
  elements[10] = queryElement(10, 1, 0, 'Sibling10');
  modelState.setState({
    queryState: { queryElemnts: elements, indexCurrentElement: 0 },
    rankQueryElements: [['0', 0], ['01', 1], ['012', 2], ['010', 10]],
  });

  render(<SOQLPath />);
  expect(screen.getByText(/Root/).closest('[style]')).toHaveStyle({ paddingLeft: '0px' });
  expect(screen.getByText(/Child/).closest('[style]')).toHaveStyle({ paddingLeft: '20px' });
  expect(screen.getByText(/Grandchild/).closest('[style]')).toHaveStyle({ paddingLeft: '40px' });
  expect(screen.getByText(/Sibling10/).closest('[style]')).toHaveStyle({ paddingLeft: '20px' });
});

it('places a child of a child under its actual parent; fields are still needed to run it', () => {
  const root = queryElement(0, 0, -1, 'Account');
  act(() => modelState.setState({
    state: { ...modelState.getState().state, orgSfName: 'fixture-org' },
    queryState: { queryElemnts: [root], indexCurrentElement: 0 },
    rankQueryElements: [['0', 0]],
  }));
  const child = (name: string, index: number): GetChildRelationships => ({
    orgSfName: 'fixture-org', sObjectLocalId: index, childSObject: name,
    relationshipName: `${name}s`, fieldNameAPI: 'ParentId',
  });
  act(() => modelState.getState().gotoChild(child('Contact', 1)));
  act(() => modelState.getState().gotoChild(child('Task', 2)));
  const state = modelState.getState();
  expect(state.queryState.queryElemnts[2].parent).toBe(1);
  expect(state.rankQueryElements?.map(([, index]) => index)).toEqual([0, 1, 2]);
  const ast = legacyQueryToAst(state.queryState)!;
  expect(ast.select[0]).toMatchObject({ kind: 'subquery', query: {
    relationship: 'Contacts', select: [{ kind: 'subquery', query: { relationship: 'Tasks' } }],
  } });
  expect(validateQuery(ast).map(error => error.code)).toContain('SELECT_REQUIRED');
  expect(state.sqlState.isValid).toBe(false);

  render(<SOQLPath />);
  expect(screen.getByText(/Account/).closest('[style]')).toHaveStyle({ paddingLeft: '0px' });
  expect(screen.getByText(/Contact/).closest('[style]')).toHaveStyle({ paddingLeft: '20px' });
  expect(screen.getByText(/Task/).closest('[style]')).toHaveStyle({ paddingLeft: '40px' });

  act(() => modelState.getState().gotoChild(child('Event', 3)));
  act(() => modelState.getState().gotoChild(child('Note', 4)));
  expect(modelState.getState().queryState.queryElemnts).toHaveLength(5);
  expect(() => modelState.getState().gotoChild(child('Attachment', 5)))
    .toThrow('SOQL supports at most five levels of child relationships.');
  expect(modelState.getState().queryState.queryElemnts).toHaveLength(5);
});
