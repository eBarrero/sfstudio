const assert = require('node:assert/strict');
const { it } = require('node:test');
const { errorHandler } = require('../build/infrastructure/frameworks/errorHandler');

it('does not write Mongo duplicate values to logs or public errors', () => {
    const messages = [];
    const previous = console.error;
    console.error = value => messages.push(value);
    const response = {
        statusCode: 0,
        status(code) { this.statusCode = code; return this; },
        json(value) { this.body = value; return this; },
    };
    const error = new Error('E11000 duplicate key: connections.userId = private-fixture-id');
    error.name = 'MongoServerError';
    try {
        errorHandler(error, { correlationId: 'fixture-correlation' }, response);
    } finally {
        console.error = previous;
    }
    assert.equal(response.statusCode, 500);
    assert.equal(response.body.error.code, 'INTERNAL_ERROR');
    assert.equal(messages.length, 1);
    assert.equal(messages[0].includes('private-fixture-id'), false);
    assert.equal(JSON.stringify(response.body).includes('private-fixture-id'), false);
});
