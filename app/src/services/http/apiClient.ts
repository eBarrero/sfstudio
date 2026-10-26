import { validateApiBaseUrl } from './apiBase';

declare const __SFSTUDIO_API_BASE__: string;
declare const __SFSTUDIO_API_MODE__: string;

export interface PublicApiError {
  error: { code: string; message: string; correlationId?: string };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly correlationId: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  legacy?: boolean;
  body?: unknown;
}

export function createApiClient(baseUrl = typeof __SFSTUDIO_API_BASE__ === 'string'
  ? __SFSTUDIO_API_BASE__ : '/api/v1', fetcher?: typeof fetch,
  mode = typeof __SFSTUDIO_API_MODE__ === 'string' ? __SFSTUDIO_API_MODE__ : 'production',
  newCorrelationId: () => string = () => crypto.randomUUID()) {
  const base = validateApiBaseUrl(baseUrl, mode);
  const legacyBase = base.slice(0, -3);

  function url(path: string, legacy = false): string {
    if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_%.-]+)*$/.test(path)) {
      throw new Error('Invalid API path.');
    }
    return `${legacy ? legacyBase : base}/${path}`;
  }

  async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const correlationId = newCorrelationId();
    const response = await (fetcher ?? fetch)(url(path, options.legacy), {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Correlation-Id': correlationId,
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      const error = extractError(payload);
      const actualCorrelationId = error?.correlationId ?? response.headers.get('X-Correlation-Id') ?? correlationId;
      const apiError = new ApiError(response.status, error?.code ?? `HTTP_${response.status}`,
        error?.message ?? 'La solicitud no se pudo completar.', actualCorrelationId);
      if (response.status === 401 && typeof window !== 'undefined') {
        if (apiError.code === 'REAUTH_REQUIRED') window.dispatchEvent(new Event('sfstudio:reauth-required'));
        if (apiError.code === 'SESSION_INVALID') window.dispatchEvent(new Event('sfstudio:workspace-expired'));
      }
      throw apiError;
    }
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }

  return { request, url };
}

function extractError(value: unknown): PublicApiError['error'] | null {
  if (!value || typeof value !== 'object' || !('error' in value)) return null;
  const candidate = value.error;
  if (!candidate || typeof candidate !== 'object' || !('code' in candidate) ||
      typeof candidate.code !== 'string' || !('message' in candidate) ||
      typeof candidate.message !== 'string') return null;
  const correlationId = 'correlationId' in candidate && typeof candidate.correlationId === 'string'
    ? candidate.correlationId : undefined;
  return { code: candidate.code, message: candidate.message, correlationId };
}

export const apiClient = createApiClient();
