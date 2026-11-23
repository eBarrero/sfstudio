const assert = require('node:assert/strict');
const { it } = require('node:test');
const express = require('express');
const { createApp } = require('../build/app');
const { StructuredLogger } = require('../build/infrastructure/frameworks/structuredLogger');
const { safeRequestPath } = require('../build/infrastructure/frameworks/safeRequestPath');

function recordingLogger() {
  const entries = [];
  const sink = { log: text => entries.push(JSON.parse(text)),
    warn: text => entries.push(JSON.parse(text)), error: text => entries.push(JSON.parse(text)) };
  return { entries, logger: new StructuredLogger(sink) };
}

it('logs route templates and unknown safe paths with a matching correlation ID', async () => {
  const { entries, logger } = recordingLogger();
  const router = express.Router();
  router.get('/api/v1/connections/:orgKey/authorize', (_req, res) => res.json({ ok: true }));
  const app = createApp({ apiRouter: router, readinessProbe: { isReady: async () => true },
    environment: 'TESTING', requestLogger: logger });
  const server = await new Promise(resolve => {
    const candidate = app.listen(0, '127.0.0.1', () => resolve(candidate));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const known = await fetch(`${base}/api/v1/connections/00D000000000001:005000000000001/authorize?code=hidden`);
    assert.equal(known.status, 200);
    const knownLog = entries.find(entry => entry.event === 'http.request');
    assert.equal(knownLog.requestedPath, '/api/v1/connections/:orgKey/authorize');
    assert.equal(knownLog.correlationId, known.headers.get('x-correlation-id'));

    const missing = await fetch(`${base}/api/ruta-inexistente?state=hidden&code=private`);
    assert.equal(missing.status, 404);
    const body = await missing.json();
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.equal(body.error.correlationId, missing.headers.get('x-correlation-id'));
    const notFound = entries.find(entry => entry.event === 'http.not_found');
    const request = entries.filter(entry => entry.event === 'http.request').at(-1);
    assert.equal(notFound.requestedPath, '/api/ruta-inexistente');
    assert.equal(notFound.method, 'GET');
    assert.equal(notFound.status, 404);
    assert.equal(notFound.correlationId, body.error.correlationId);
    assert.equal(request.requestedPath, notFound.requestedPath);
    assert.equal(request.correlationId, notFound.correlationId);
    assert.equal(JSON.stringify(entries).includes('hidden'), false);
    assert.equal(JSON.stringify(entries).includes('private'), false);
    assert.equal(JSON.stringify(body).includes('ruta-inexistente'), false);

    const missingPage = await fetch(`${base}/pagina-inexistente`);
    assert.equal(missingPage.status, 404);
    assert.equal(entries.filter(entry => entry.event === 'http.not_found').at(-1).requestedPath,
      '/pagina-inexistente');

    const sensitive = await fetch(`${base}/api/00D000000000001:005000000000001?cursor=opaque-secret`);
    assert.equal(sensitive.status, 404);
    const sensitiveLog = entries.filter(entry => entry.event === 'http.not_found').at(-1);
    assert.equal(sensitiveLog.requestedPath, '/api/[REDACTED]');
    assert.equal(JSON.stringify(entries).includes('00D000000000001'), false);
    assert.equal(JSON.stringify(entries).includes('opaque-secret'), false);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

it('redacts dynamic, encoded and long segments in unknown paths', () => {
  const paths = [
    ['/api/00D000000000001:005000000000001', '00D000000000001'],
    ['/api/person@example.test', 'person@example.test'],
    ['/api/SELECT%20Id%20FROM%20Account', 'SELECT'],
    ['/api/token-secret-value', 'token-secret-value'],
    [`/api/${'a'.repeat(1000)}`, 'a'.repeat(1000)],
    ['/api/01gAAA-100', '01gAAA-100'],
  ];
  for (const [path, secret] of paths) {
    const safe = safeRequestPath(path);
    assert.equal(safe.includes(secret), false);
    assert.match(safe, /^\/api\/\[REDACTED\]$/);
    assert.ok(safe.length < 256);
  }
});
