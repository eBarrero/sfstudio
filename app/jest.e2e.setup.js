const { TextEncoder, TextDecoder } = require('util');
const { randomUUID } = require('node:crypto');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
if (!global.crypto.randomUUID) {
    Object.defineProperty(global.crypto, 'randomUUID', { value: randomUUID, configurable: true });
}

if (!global.fetch) {
    global.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ version: 1, connections: [], activeOrgKey: null })
    });
}
