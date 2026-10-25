const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (!global.fetch) {
    global.fetch = async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => 'newsession'
    });
}
