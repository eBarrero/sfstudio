const assert = require('node:assert/strict');
const { it } = require('node:test');
const { EventEmitter } = require('node:events');
const { correlationMiddleware } = require('../build/infrastructure/frameworks/correlation');

it('echoes a valid client correlation ID and replaces malformed input', () => {
  const entries = [];
  const middleware = correlationMiddleware({ info: (_event, context) => entries.push(context) });
  const id = '123e4567-e89b-42d3-a456-426614174000';
  const response = new EventEmitter();
  response.setHeader = (_name, value) => { response.id = value; };
  middleware({ get: () => id, method: 'GET', path: '/api/health' }, response, () => {});
  assert.equal(response.id, id);
  response.emit('finish');
  middleware({ get: () => 'private-bad-value', method: 'GET', path: '/api/health' }, response, () => {});
  assert.match(response.id, /^[0-9a-f-]{36}$/);
  assert.notEqual(response.id, 'private-bad-value');
  response.emit('finish');
  assert.equal(entries.length, 2);
  assert.equal(entries[0].requestedPath, '/api/health');
});
