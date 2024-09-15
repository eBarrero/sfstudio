import test from 'node:test';
import assert from 'node:assert';
import { salesforceJsontoInlineJson } from './inlineJson';
import json  from '../Mocks/resp.json' assert { type: 'json'};

test('inlineJson', () => {
  const result = salesforceJsontoInlineJson(json);
  assert(result === 'Hello, World!');
});
