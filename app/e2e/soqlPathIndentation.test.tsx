import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import SOQLPath from '../src/components/organisms/SOQLPath/soqlPath';
import modelState from '../src/store/modelState';

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

afterEach(cleanup);

it('indents by tree depth, including a two-digit element index', () => {
  const elements = Array.from({ length: 11 }, (_, index) =>
    queryElement(index, index === 0 ? 0 : 1, index === 0 ? -1 : 0, `Element${index}`));
  elements[0] = queryElement(0, 0, -1, 'Root');
  elements[1] = queryElement(1, 1, 0, 'Child');
  elements[2] = queryElement(2, 2, 1, 'Grandchild');
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
