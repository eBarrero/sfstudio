import 'fake-indexeddb/auto';
import { getDescribe, getDescribeObject } from '../src/services/salesforceSchema/controller';
import { metadataCache } from '../src/services/salesforceSchema/metadataCache';
import { loadGlobal, loadObject } from '../src/services/salesforceSchema/snapshotAdapter';
import sessionState from '../src/store/sessionState';

jest.mock('../src/services/salesforceSchema/controller', () => ({
  getDescribe: jest.fn(), getDescribeObject: jest.fn(),
}));

const orgKey = '00D000000000001:005000000000001';
const raw = { name: 'Account', label: 'Cuenta', labelPlural: 'Cuentas',
  keyPrefix: '001', custom: false, queryable: true, createable: true,
  updateable: true, deletable: true, fields: [], childRelationships: [] };

beforeAll(() => {
  globalThis.structuredClone ??= <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
  sessionState.setState({ publicSession: {
    version: 1, activeOrgKey: orgKey,
    connections: [{ orgKey, organizationId: '00D000000000001', userId: '005000000000001',
      userName: 'Test User', alias: 'Integration', instanceUrl: 'https://example.test',
      loginHost: 'https://test.salesforce.com', environmentKind: 'SANDBOX', status: 'CONNECTED' }],
  } });
});

test('global and object describes hit cache after the first opening', async () => {
  (getDescribe as jest.Mock).mockResolvedValue({ sobjects: [{ ...raw, fields: null,
    childRelationships: null }] });
  (getDescribeObject as jest.Mock).mockResolvedValue(raw);
  expect((await loadGlobal(orgKey))[0].name).toBe('Account');
  expect((await loadGlobal(orgKey))[0].name).toBe('Account');
  expect((await loadObject(orgKey, 'Account')).fields).toEqual([]);
  expect((await loadObject(orgKey, 'Account')).fields).toEqual([]);
  expect(getDescribe).toHaveBeenCalledTimes(1);
  expect(getDescribeObject).toHaveBeenCalledTimes(1);
  metadataCache.clearMemory();
  expect((await loadGlobal(orgKey))[0].name).toBe('Account');
  expect((await loadObject(orgKey, 'Account')).fields).toEqual([]);
  expect(getDescribe).toHaveBeenCalledTimes(1);
  expect(getDescribeObject).toHaveBeenCalledTimes(1);
});
