import 'fake-indexeddb/auto';
import { getDescribe, getDescribeObject } from '../src/services/salesforceSchema/controller';
import { metadataCache } from '../src/services/salesforceSchema/metadataCache';
import { freezeComparisonSnapshots, loadGlobal, loadObject, metadataStatus,
  refreshGlobal } from '../src/services/salesforceSchema/snapshotAdapter';
import { normalizeSnapshot } from '../src/services/salesforceSchema/metadataSnapshot';
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

test('expired data is shown while one concurrent refresh runs', async () => {
  const future = Date.now() + 2 * 24 * 60 * 60 * 1000;
  const clock = jest.spyOn(Date, 'now').mockReturnValue(future);
  let resolve!: (value: { sobjects: typeof raw[] }) => void;
  (getDescribe as jest.Mock).mockReturnValueOnce(new Promise(done => { resolve = done; }));
  try {
    expect((await loadGlobal(orgKey))[0].label).toBe('Cuenta');
    expect(metadataStatus(orgKey).state).toBe('REFRESHING');
    const second = refreshGlobal(orgKey);
    expect(getDescribe).toHaveBeenCalledTimes(2);
    resolve({ sobjects: [{ ...raw, label: 'Cuenta nueva' }] });
    expect((await second)[0].label).toBe('Cuenta nueva');
    expect(metadataStatus(orgKey).state).toBe('FRESH');
  } finally { clock.mockRestore(); }
});

test('failed refresh retains the last snapshot with a visible error', async () => {
  (getDescribe as jest.Mock).mockRejectedValueOnce(new Error('remote failure'));
  await expect(refreshGlobal(orgKey)).rejects.toThrow('remote failure');
  expect(metadataStatus(orgKey)).toMatchObject({ state: 'ERROR',
    fetchedAt: expect.any(Number) });
});

test('comparison snapshots stay frozen after source data changes', () => {
  const identity = { organizationId: '00D000000000001', userId: '005000000000001',
    orgKey, apiVersion: '61.0', locale: 'es-ES' };
  const source = normalizeSnapshot(identity, [raw as unknown as Salesforce_SObject], 100, 200);
  const destination = normalizeSnapshot({ ...identity, organizationId: '00D000000000002',
    orgKey: '00D000000000002:005000000000001' }, [raw as unknown as Salesforce_SObject], 100, 200);
  const [lockedSource, lockedDestination] = freezeComparisonSnapshots(source, destination);
  source.objects.Account.label = 'Changed';
  expect(lockedSource.objects.Account.label).toBe('Cuenta');
  expect(Object.isFrozen(lockedSource.objects.Account)).toBe(true);
  expect(lockedDestination.organizationId).toBe('00D000000000002');
});
