const { TextEncoder, TextDecoder } = require('util');

// Asigna globalmente para que cualquier librería que las requiera las encuentre.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (!global.fetch) {
    global.fetch = require('node-fetch');
}
