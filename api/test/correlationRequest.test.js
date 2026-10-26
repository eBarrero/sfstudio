const assert = require('node:assert/strict');
const { it } = require('node:test');
const { correlationMiddleware } = require('../build/infrastructure/frameworks/correlation');

it('echoes a valid client correlation ID and replaces malformed input', () => {
  const entries = [];
  const middleware = correlationMiddleware({ info: (_event, context) => entries.push(context) });
  const id = '123e4567-e89b-42d3-a456-426614174000';
  const response = { setHeader: (_name, value) => { response.id = value; } };
  middleware({ get: () => id, method: 'GET' }, response, () => {});
  assert.equal(response.id, id);
  middleware({ get: () => 'private-bad-value', method: 'GET' }, response, () => {});
  assert.match(response.id, /^[0-9a-f-]{36}$/);
  assert.notEqual(response.id, 'private-bad-value');
  assert.equal(entries.length, 2);
});
