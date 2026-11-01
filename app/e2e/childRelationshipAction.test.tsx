import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TableChildRelationShips from '../src/components/organisms/tableChildRelationShips/tableChildRelationShips';
import applicationState from '../src/store/applicationState';
import dataState from '../src/store/dataState';

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

it('uses the registered child command when a relationship is selected', () => {
  dataState.setState({ childRelationships: [{
    orgSfName: 'fixture-org', sObjectLocalId: 1, childSObject: 'Contact',
    relationshipName: 'Contacts', fieldNameAPI: 'AccountId',
  }] });
  const execute = jest.spyOn(applicationState.getState(), 'exeCommandFromUI').mockImplementation(() => {});
  render(<TableChildRelationShips />);
  fireEvent.click(screen.getByText('Contact'));
  expect(execute).toHaveBeenCalledWith('child_Contact');
});
