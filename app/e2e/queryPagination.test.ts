import Proxy from '../src/services/salesforceSchema/proxy';
import sessionState from '../src/store/sessionState';
import sqlExecutionState from '../src/store/sqlExecutionState';
import type { SalesforceQueryResponse } from '../src/services/salesforceSchema/controller';

const orgA = '00D000000000001:005000000000001';
const orgB = '00D000000000002:005000000000002';
const connection = (orgKey: string) => ({ orgKey, organizationId: orgKey.split(':')[0], userId: orgKey.split(':')[1],
  userName: 'fixture', alias: orgKey === orgA ? 'Integration' : 'UAT', instanceUrl: 'https://example.salesforce.com',
  loginHost: 'https://test.salesforce.com', environmentKind: 'SANDBOX' as const, status: 'CONNECTED' as const });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  jest.restoreAllMocks();
  sqlExecutionState.getState().resetForOrg();
});

it('appends pages in order and never sends an opaque cursor to another org', async () => {
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: orgA,
    connections: [connection(orgA), connection(orgB)] } });
  jest.spyOn(Proxy, 'sendSoqlAdapter').mockResolvedValue({ done: false, totalSize: 2,
    records: [{ Name: 'first' }], limit: 2, cursor: 'opaque' });
  const next = jest.spyOn(Proxy, 'nextSoqlPage').mockResolvedValue({ done: true, totalSize: 2,
    records: [{ Name: 'second' }], limit: 2 });
  sqlExecutionState.getState().executeSql(orgA, 'SELECT Name FROM Account');
  await flush();
  expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('PARTIAL');
  sqlExecutionState.getState().nextPage();
  await flush();
  expect(next).toHaveBeenCalledWith(orgA, 'opaque', expect.any(AbortSignal));
  expect(sqlExecutionState.getState().records.map(row => row.Name)).toEqual(['first', 'second']);
  expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('DONE');
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: orgB,
    connections: [connection(orgA), connection(orgB)] } });
  sqlExecutionState.getState().nextPage();
  expect(next).toHaveBeenCalledTimes(1);
});

it('aborts a pending request on target change and ignores a late response', async () => {
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: orgA,
    connections: [connection(orgA), connection(orgB)] } });
  let resolvePage!: (page: SalesforceQueryResponse) => void;
  let signal: AbortSignal | undefined;
  jest.spyOn(Proxy, 'sendSoqlAdapter').mockImplementation((_org, _query, requestSignal) => {
    signal = requestSignal;
    return new Promise(resolve => { resolvePage = resolve; });
  });
  sqlExecutionState.getState().executeSql(orgA, 'SELECT Name FROM Account');
  sqlExecutionState.getState().resetForOrg();
  sessionState.setState({ publicSession: { version: 1, activeOrgKey: orgB,
    connections: [connection(orgA), connection(orgB)] } });
  resolvePage({ done: true, totalSize: 1, records: [{ Name: 'late' }], limit: 200 });
  await flush();
  expect(signal?.aborted).toBe(true);
  expect(sqlExecutionState.getState().records).toEqual([]);
  expect(sqlExecutionState.getState().sqlExecutionStatus).toBe('INIT');
});
