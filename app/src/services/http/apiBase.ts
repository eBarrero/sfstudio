/** The browser uses the same host unless an explicit Vite override is supplied. */
export function validateApiBaseUrl(value: string | undefined, mode: string): string {
  const base = value?.trim() || '/api/v1';
  if (base.startsWith('/')) {
    if (!/^\/(?:[a-zA-Z0-9_-]+\/)*api\/v1\/?$/.test(base)) {
      throw new Error('VITE_API_BASE_URL must end in /api/v1.');
    }
    return base.replace(/\/$/, '');
  }

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new Error('VITE_API_BASE_URL must be an absolute HTTPS URL or a relative API path.');
  }
  const localDevelopment = mode !== 'production' && url.protocol === 'http:' &&
    ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !localDevelopment) || url.username || url.password ||
      url.search || url.hash || !/\/api\/v1\/?$/.test(url.pathname)) {
    throw new Error('VITE_API_BASE_URL must be a safe API v1 endpoint.');
  }
  return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
}
