import { waitFor } from '@testing-library/react';
import dataState from '../src/store/dataState';
import Proxy from '../src/services/salesforceSchema/proxy';

const orgKey = '00D000000000001:005000000000001';
const relationship = (name: string, objectId: number): GetChildRelationships => ({
  orgSfName: orgKey,
  sObjectLocalId: objectId,
  childSObject: name,
  relationshipName: `${name}s`,
  fieldNameAPI: 'ParentId',
});

beforeAll(() => {
  globalThis.structuredClone ??= <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
});
afterEach(() => jest.restoreAllMocks());

it('updates child relationships when navigating to another object through fields', async () => {
  dataState.getState().activateOrg(orgKey);
  const getFields = jest.spyOn(Proxy, 'getFieldsAdapter').mockResolvedValue([]);
  jest.spyOn(Proxy, 'getChildRelationships').mockImplementation((_org, objectId) =>
    [relationship(objectId === 2 ? 'NewChild' : 'OldChild', objectId)]);
  dataState.getState().loadChildRelationships(orgKey, 1);
  expect(dataState.getState().childRelationships[0].childSObject).toBe('OldChild');

  dataState.getState().loadFields(orgKey, 2);
  await waitFor(() => expect(getFields).toHaveBeenCalledWith(orgKey, 2, expect.anything()));
  await waitFor(() => expect(dataState.getState().childRelationships[0].childSObject).toBe('NewChild'));
});

it('updates child relationships when navigating through a parent lookup', async () => {
  dataState.getState().activateOrg(orgKey);
  jest.spyOn(Proxy, 'getFieldsAdapter').mockResolvedValue([]);
  jest.spyOn(Proxy, 'getChildRelationships').mockImplementation((_org, objectId) =>
    [relationship(objectId === 3 ? 'LookupChild' : 'OldChild', objectId)]);
  dataState.getState().loadChildRelationships(orgKey, 1);

  dataState.getState().loadFieldsFromLookup({ orgSfName: orgKey, referenceToLocalId: [3] } as GetFieldsIndex);
  await waitFor(() => expect(dataState.getState().childRelationships[0].childSObject).toBe('LookupChild'));
});
