import { ApiError, createApiClient } from '../src/services/http/apiClient';
import { validateApiBaseUrl } from '../src/services/http/apiBase';
import { getDescribe, sendQuery } from '../src/services/salesforceSchema/controller';

const correlationId = '123e4567-e89b-42d3-a456-426614174000';

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => correlationId },
    json: async () => body,
  } as unknown as Response;
}

it('uses the relative API v1 base, credentials and a correlation ID', async () => {
  const fetcher = jest.fn().mockResolvedValue(response(200, { version: 1, connections: [], activeOrgKey: null }));
  const client = createApiClient('/api/v1', fetcher, 'production', () => correlationId);
  expect(await client.request('workspace')).toEqual({ version: 1, connections: [], activeOrgKey: null });
  expect(fetcher).toHaveBeenCalledWith('/api/v1/workspace', expect.objectContaining({
    credentials: 'include',
    headers: expect.objectContaining({ 'X-Correlation-Id': correlationId }),
  }));
  expect(client.url('describeGlobal/fixture', true)).toBe('/api/describeGlobal/fixture');
});

it.each([
  [400, 'ORG_KEY_INVALID'],
  [401, 'REAUTH_REQUIRED'],
  [404, 'ORG_NOT_FOUND'],
  [500, 'INTERNAL_ERROR'],
])('preserves code and correlationId on HTTP %i', async (status, code) => {
  const fetcher = jest.fn().mockResolvedValue(response(status, {
    error: { code, message: 'Mensaje público', correlationId },
  }));
  const client = createApiClient('/api/v1', fetcher, 'production', () => correlationId);
  try {
    await client.request('workspace');
    throw new Error('The API request should have failed');
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status, code, correlationId });
  }
});

it('emits distinct actions for an expired org token and workspace session', async () => {
  const reauth = jest.fn();
  const expired = jest.fn();
  window.addEventListener('sfstudio:reauth-required', reauth);
  window.addEventListener('sfstudio:workspace-expired', expired);
  try {
    for (const code of ['REAUTH_REQUIRED', 'SESSION_INVALID']) {
      const fetcher = jest.fn().mockResolvedValue(response(401, { error: { code, message: code } }));
      await expect(createApiClient('/api/v1', fetcher, 'production', () => correlationId)
        .request('workspace')).rejects.toBeInstanceOf(ApiError);
    }
    expect(reauth).toHaveBeenCalledTimes(1);
    expect(expired).toHaveBeenCalledTimes(1);
  } finally {
    window.removeEventListener('sfstudio:reauth-required', reauth);
    window.removeEventListener('sfstudio:workspace-expired', expired);
  }
});

it('validates the Vite override and keeps metadata and query results out of localStorage', async () => {
  expect(validateApiBaseUrl(undefined, 'production')).toBe('/api/v1');
  expect(validateApiBaseUrl('https://example.test/api/v1/', 'production')).toBe('https://example.test/api/v1');
  expect(() => validateApiBaseUrl('http://example.test/api/v1', 'production')).toThrow();
  expect(() => validateApiBaseUrl('https://example.test/api/v1?token=fixture', 'production')).toThrow();

  const calls: string[] = [];
  const previous = global.fetch;
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return response(200, calls.length === 1 ? { sobjects: [] } : { records: [], done: true, totalSize: 0 });
  });
  localStorage.clear();
  try {
    await getDescribe('00D000000000001:005000000000001');
    await sendQuery('00D000000000001:005000000000001', 'SELECT Id FROM Account');
    expect(calls[0]).toContain('/api/describeGlobal/');
    expect(calls[1]).toContain('/api/soql/');
    expect(localStorage.length).toBe(0);
  } finally {
    global.fetch = previous;
  }
});
