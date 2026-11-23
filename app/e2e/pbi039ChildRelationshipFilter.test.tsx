import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { filterChildRelationships } from '../src/core/filterChildRelationships';
import { SFFieldTypesEnum } from '../src/core/constants/fields';
import TableChildRelationShips from '../src/components/organisms/tableChildRelationShips/tableChildRelationShips';
import SObjectPanel from '../src/components/organisms/sObjectPanel/sObjectPanel';
import Proxy from '../src/services/salesforceSchema/proxy';
import applicationState from '../src/store/applicationState';
import dataState from '../src/store/dataState';
import modelState from '../src/store/modelState';
import objectPanelState from '../src/store/objectPanelState';
import viewState from '../src/store/viewState';

const orgKey = '00D000000000001:005000000000001';
const relation = (childSObject: string, relationshipName: string): GetChildRelationships => ({
  orgSfName: orgKey, sObjectLocalId: 1, childSObject, relationshipName, fieldNameAPI: 'ParentId',
});
const relations = [relation('Policy__c', 'Policies'), relation('Contact', 'Contacts')];

globalThis.structuredClone ??= <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  dataState.getState().clearSchema();
  objectPanelState.getState().resetTab();
});

test('matches all terms across the two visible columns and restores all rows on empty text', () => {
  expect(filterChildRelationships(relations, '  POLicy   policies  ')).toEqual([relations[0]]);
  expect(filterChildRelationships(relations, 'contact  CONTACTS')).toEqual([relations[1]]);
  expect(filterChildRelationships(relations, 'policy contacts')).toEqual([]);
  expect(filterChildRelationships(relations, '  ')).toBe(relations);
});

test('the object search filters visible relations without clearing the full list or its navigation', async () => {
  dataState.getState().activateOrg(orgKey);
  jest.spyOn(Proxy, 'getChildRelationships').mockReturnValue(relations);
  jest.spyOn(Proxy, 'getFieldsAdapter').mockResolvedValue([]);
  dataState.getState().loadChildRelationships(orgKey, 0);
  const execute = jest.spyOn(applicationState.getState(), 'exeCommandFromUI').mockImplementation(() => {});
  render(<TableChildRelationShips />);
  expect(screen.getByText('Policy__c')).toBeInTheDocument();
  expect(screen.getByText('Contact')).toBeInTheDocument();

  act(() => dataState.getState().setFieldFilterText(orgKey, 0, '  policies '));
  expect(dataState.getState().childRelationships).toEqual(relations);
  expect(screen.getByText('Policy__c')).toBeInTheDocument();
  expect(screen.queryByText('Contact')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Policy__c'));
  expect(execute).toHaveBeenCalledWith('child_Policy__c');
  await waitFor(() => expect(dataState.getState().sObjectFields).toEqual([]));
  expect(Proxy.getChildRelationships).toHaveBeenCalledTimes(1);

  act(() => dataState.getState().setFieldFilterText(orgKey, 0, ''));
  expect(screen.getByText('Contact')).toBeInTheDocument();
});

test('an org change clears relations and ignores the previous org filter', () => {
  dataState.getState().activateOrg(orgKey);
  jest.spyOn(Proxy, 'getChildRelationships').mockReturnValue(relations);
  dataState.getState().loadChildRelationships(orgKey, 0);
  dataState.getState().setFieldFilterText(orgKey, 0, 'Policy');
  dataState.getState().activateOrg('00D000000000002:005000000000002');
  expect(dataState.getState().childRelationships).toEqual([]);
  expect(dataState.getState().childRelationshipsObjectId).toBeNull();
  expect(dataState.getState().fieldsFilter.searchText).toBeNull();
});

test('the same search survives switching between Fields and Child Relationships', () => {
  dataState.getState().activateOrg(orgKey);
  jest.spyOn(Proxy, 'getChildRelationships').mockReturnValue(relations);
  jest.spyOn(Proxy, 'getFieldsAdapter').mockResolvedValue([]);
  dataState.getState().loadChildRelationships(orgKey, 0);
  modelState.setState({ queryState: { indexCurrentElement: 0, queryElemnts: [{
    type: 'ROOT', parent: -1, level: 0, limit: 50,
    sObjectId: { orgSfName: orgKey, sObjectApiName: 'Account', sObjectLocalId: 0 },
    selectClause: { fields: [] },
  }] } });
  viewState.getState().setCurrentView('sobject');
  act(() => dataState.getState().setFieldFilterText(orgKey, 0, 'Policy'));
  render(<SObjectPanel />);
  fireEvent.click(screen.getByRole('tab', { name: 'Child Relationships' }));
  expect(screen.getByText('Policy__c')).toBeInTheDocument();
  expect(screen.queryByText('Contact')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Fields' }));
  expect(dataState.getState().fieldsFilter.searchText).toBe('Policy');
  fireEvent.click(screen.getByRole('tab', { name: 'Child Relationships' }));
  expect(screen.getByText('Policy__c')).toBeInTheDocument();
});

test('field type and property filters do not restrict child relationships', async () => {
  dataState.getState().activateOrg(orgKey);
  jest.spyOn(Proxy, 'getChildRelationships').mockReturnValue(relations);
  jest.spyOn(Proxy, 'getFieldsAdapter').mockResolvedValue([]);
  dataState.getState().loadChildRelationships(orgKey, 0);
  dataState.getState().setFieldFilterType(orgKey, 0, SFFieldTypesEnum.Text);
  await waitFor(() => expect(dataState.getState().childRelationships).toEqual(relations));
  dataState.getState().setFieldFilter(orgKey, 0, 'custom', true);
  await waitFor(() => expect(dataState.getState().childRelationships).toEqual(relations));
  expect(dataState.getState().fieldsFilter.type).toBe(SFFieldTypesEnum.Text);
  expect(dataState.getState().fieldsFilter.custom).toBe(true);
});
