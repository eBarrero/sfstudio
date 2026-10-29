const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const express = require('express');
const { createApp } = require('../build/app');
const { Sessions } = require('../build/sessionManager/domain/entities/sessions');
const { ConnectionRegistry } = require('../build/sessionManager/infrastructure/output_adapter/connectionServices/connectionRegistry');
const { ConnectionDriverDTO, Technology } = require('../build/sessionManager/application/dtos/connectionDriverDTO');
const { UserDTO } = require('../build/sessionManager/application/dtos/userDTO');
const { createOrgKey } = require('../build/sessionManager/domain/entities/orgKey');
const { MetadataRequestUseCase } = require('../build/sessionManager/application/use_cases/metadataUseCases');
const { SignInController } = require('../build/sessionManager/infrastructure/input_adapter/httpControllers');
const { HttpMetadataControllers } = require('../build/sessionManager/infrastructure/input_adapter/httpMetadataControllers');
const { SESSION_COOKIE_NAME } = require('../build/sessionManager/infrastructure/input_adapter/sessionCookie');
const { enforceReadOnlySoql } = require('../build/sessionManager/domain/entities/readonlySoql');
const { ReauthRequiredError } = require('../build/sessionManager/domain/exceptions/reauthRequiredError');

const orgKey = createOrgKey('00D000000000001', '005000000000001');
const otherKey = createOrgKey('00D000000000002', '005000000000002');

async function harness(options = {}) {
    const registry = new ConnectionRegistry();
    const sessions = new Sessions(id => registry.deleteSession(id));
    const config = new ConnectionDriverDTO({ tech: Technology.SF_Test, dbId: '00D000000000001',
        userId: '005000000000001', userName: 'fixture', dbName: 'integration', alias: 'Integration',
        instanceUrl: 'https://integration.my.salesforce.com' });
    const secondConfig = new ConnectionDriverDTO({ tech: Technology.SF_Test, dbId: '00D000000000002',
        userId: '005000000000002', userName: 'fixture', dbName: 'uat', alias: 'UAT',
        instanceUrl: 'https://uat.my.salesforce.com' });
    const owner = sessions.addNewUser();
    const other = sessions.addNewUser();
    for (const user of [owner, other]) user.loadConnections(new UserDTO(user.getSessionId(), 'fixture', new Date(), user.getExpiresAt(),
        options.secondOrg && user === owner ? [config, secondConfig] : [config]));
    const calls = [];
    const driver = { dispose() {}, doSOQL: async query => {
        calls.push(query);
        if (options.expired) throw new ReauthRequiredError();
        if (options.pending) return new Promise(() => {});
        return options.paginated ? { done: false, totalSize: 2, records: [{ Id: 'fixture-id' }],
            nextRecordsUrl: '/services/data/v65.0/query/01gAAA-100' }
            : { done: true, totalSize: 1, records: [{ Id: 'fixture-id' }] };
    }, queryMore: async locator => {
        calls.push(`more:${locator}`);
        return { done: true, totalSize: 2, records: [{ Id: 'fixture-id-2' }] };
    } };
    if (!options.disconnected) registry.addConnection(owner.getSessionId(), orgKey, driver, owner.getExpiresAt());
    if (options.secondOrg) registry.addConnection(owner.getSessionId(), otherKey, driver, owner.getExpiresAt());
    const signIn = new SignInController({
        getSessionStatus: async id => {
            const user = sessions.getUser(id);
            user.reconcileActiveConnections(new Set(registry.listOrgKeys(id)));
            return user.getSessionStatus();
        }, getStatus: () => 'ok',
    });
    const queryUseCase = new MetadataRequestUseCase(sessions, registry);
    const metadata = new HttpMetadataControllers(queryUseCase, options.timeoutMs ?? 100,
        options.rateLimit ?? 60);
    const router = express.Router();
    router.post('/api/v1/query', signIn.setUser.bind(signIn), metadata.postQuery.bind(metadata));
    router.post('/api/v1/query/next', signIn.setUser.bind(signIn), metadata.postNextQueryPage.bind(metadata));
    const app = createApp({ apiRouter: router, readinessProbe: { isReady: async () => true }, environment: 'TESTING' });
    const server = await new Promise(resolve => {
        const candidate = app.listen(0, '127.0.0.1', () => resolve(candidate));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = (body, id = owner.getSessionId(), path = 'query') => fetch(`${base}/api/v1/${path}`, {
        method: 'POST', headers: { Cookie: `${SESSION_COOKIE_NAME}=${id}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return { post, calls, owner, other, registry, queryUseCase, server, close: () => new Promise(resolve => server.close(resolve)) };
}

describe('POST /api/v1/query', () => {
    it('executes SELECT under the workspace/org and returns typed JSON without leaking a URL', async () => {
        const h = await harness();
        try {
            const response = await h.post({ orgKey, query: "SELECT Id FROM Account WHERE Name = 'LIMIT 900'", limit: 25 });
            assert.equal(response.status, 200);
            assert.deepEqual(await response.json(), { done: true, totalSize: 1, records: [{ Id: 'fixture-id' }], limit: 25 });
            assert.equal(h.calls[0], "SELECT Id FROM Account WHERE Name = 'LIMIT 900' LIMIT 25");
            assert.equal((await h.post({ orgKey, query: 'SELECT Id FROM Account LIMIT 5' })).status, 200);
            assert.equal(h.calls[1], 'SELECT Id FROM Account LIMIT 5');
        } finally { await h.close(); }
    });

    it('rejects non-SELECT, over-limit, foreign, unknown and disconnected orgs', async () => {
        const h = await harness();
        try {
            const body = { orgKey, query: 'SELECT Id FROM Account' };
            const matrix = [
                [{ ...body, query: 'DELETE FROM Account' }, 'QUERY_NOT_READ_ONLY', 400],
                [{ ...body, query: 'SELECT Id FROM Account; DELETE FROM Account' }, 'QUERY_INVALID', 400],
                [{ ...body, query: 'SELECT Id FROM Account LIMIT 2001' }, 'QUERY_LIMIT_INVALID', 400],
                [{ ...body, limit: 2001 }, 'QUERY_LIMIT_INVALID', 400],
                [{ ...body, orgKey: otherKey }, 'ORG_NOT_FOUND', 404],
            ];
            for (const [input, code, status] of matrix) {
                const response = await h.post(input);
                assert.equal(response.status, status);
                const error = (await response.json()).error;
                assert.equal(error.code, code);
                assert.ok(error.correlationId);
                assert.equal(JSON.stringify(error).includes('Account'), false);
            }
            const foreign = await h.post(body, h.other.getSessionId());
            assert.equal((await foreign.json()).error.code, 'REAUTH_REQUIRED');
            h.registry.removeConnection(h.owner.getSessionId(), orgKey);
            assert.equal((await (await h.post(body)).json()).error.code, 'REAUTH_REQUIRED');
            assert.equal(h.calls.length, 0);
        } finally { await h.close(); }
    });

    it('uses stable timeout, rate-limit and reauthentication errors', async () => {
        const timeout = await harness({ pending: true, timeoutMs: 5 });
        try {
            assert.equal((await (await timeout.post({ orgKey, query: 'SELECT Id FROM Account' })).json()).error.code, 'QUERY_TIMEOUT');
        } finally { await timeout.close(); }
        const rate = await harness({ rateLimit: 1 });
        try {
            await rate.post({ orgKey, query: 'SELECT Id FROM Account' });
            assert.equal((await (await rate.post({ orgKey, query: 'SELECT Id FROM Account' })).json()).error.code, 'QUERY_RATE_LIMITED');
        } finally { await rate.close(); }
        const expired = await harness({ expired: true });
        try {
            assert.equal((await (await expired.post({ orgKey, query: 'SELECT Id FROM Account' })).json()).error.code, 'REAUTH_REQUIRED');
        } finally { await expired.close(); }
    });

    it('keeps continuation opaque, single-use and bound to workspace and org', async () => {
        const h = await harness({ paginated: true, secondOrg: true });
        try {
            const first = await (await h.post({ orgKey, query: 'SELECT Id FROM Account', limit: 2 })).json();
            assert.equal(first.done, false);
            assert.match(first.cursor, /^[0-9a-f-]{36}$/);
            assert.equal(JSON.stringify(first).includes('01gAAA'), false);
            const otherOrg = await h.post({ orgKey: otherKey, cursor: first.cursor }, undefined, 'query/next');
            assert.equal((await otherOrg.json()).error.code, 'QUERY_CURSOR_INVALID');
            const foreign = await h.post({ orgKey, cursor: first.cursor }, h.other.getSessionId(), 'query/next');
            assert.equal((await foreign.json()).error.code, 'QUERY_CURSOR_INVALID');
            const second = await (await h.post({ orgKey, cursor: first.cursor }, undefined, 'query/next')).json();
            assert.deepEqual(second.records, [{ Id: 'fixture-id-2' }]);
            assert.equal(second.done, true);
            assert.equal(h.calls[1], 'more:01gAAA-100');
            const reused = await h.post({ orgKey, cursor: first.cursor }, undefined, 'query/next');
            assert.equal((await reused.json()).error.code, 'QUERY_CURSOR_INVALID');
        } finally { await h.close(); }
    });

    it('invalidates pending cursors when the workspace closes', async () => {
        const h = await harness({ paginated: true });
        try {
            const first = await (await h.post({ orgKey, query: 'SELECT Id FROM Account', limit: 2 })).json();
            h.queryUseCase.clearWorkspace(h.owner.getSessionId());
            const response = await h.post({ orgKey, cursor: first.cursor }, undefined, 'query/next');
            assert.equal((await response.json()).error.code, 'QUERY_CURSOR_INVALID');
            assert.equal(h.calls.length, 1);
        } finally { await h.close(); }
    });
});

it('inserts a default limit before OFFSET and ignores LIMIT inside a string or child query', () => {
    assert.equal(enforceReadOnlySoql('SELECT Id FROM Account OFFSET 5', undefined).query,
        'SELECT Id FROM Account LIMIT 200 OFFSET 5');
    assert.equal(enforceReadOnlySoql('SELECT (SELECT Id FROM Contacts LIMIT 2) FROM Account', undefined).query,
        'SELECT (SELECT Id FROM Contacts LIMIT 2) FROM Account LIMIT 200');
});
