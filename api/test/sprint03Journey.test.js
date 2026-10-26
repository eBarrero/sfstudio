const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const express = require('express');
const { createApp } = require('../build/app');
const { API_SF_VERSION } = require('../build/config/environment');
const { Sessions } = require('../build/sessionManager/domain/entities/sessions');
const { ConnectionRegistry } = require('../build/sessionManager/infrastructure/output_adapter/connectionServices/connectionRegistry');
const { OAuthStateStore } = require('../build/sessionManager/domain/entities/oauthStateStore');
const { ConnectionDriverDTO, Technology } = require('../build/sessionManager/application/dtos/connectionDriverDTO');
const { UserDTO } = require('../build/sessionManager/application/dtos/userDTO');
const { SessionError, ErrorMessages } = require('../build/sessionManager/domain/exceptions/sessionError');
const { createOrgKey } = require('../build/sessionManager/domain/entities/orgKey');
const { SignInUseCase, RequestConnectionUseCase, RequestedConnectionUseCase,
    DisconnectOrgUseCase, SelectActiveOrgUseCase } = require('../build/sessionManager/application/use_cases/connectionUseCases');
const { SignInController, RequestConnectionController, RequestedConnectionController,
    DisconnectOrgController, SelectActiveOrgController } = require('../build/sessionManager/infrastructure/input_adapter/httpControllers');
const { SESSION_COOKIE_NAME, OAUTH_FLOW_COOKIE_NAME } = require('../build/sessionManager/infrastructure/input_adapter/sessionCookie');

const fixtures = {
    integration: new ConnectionDriverDTO({ tech: Technology.SF_Test, dbId: '00D000000000001',
        userId: '005000000000001', userName: 'fixture-integration', alias: 'Integration',
        dbName: 'integration', instanceUrl: 'https://integration.example.test' }),
    uat: new ConnectionDriverDTO({ tech: Technology.SF_Test, dbId: '00D000000000002',
        userId: '005000000000002', userName: 'fixture-uat', alias: 'UAT',
        dbName: 'uat', instanceUrl: 'https://uat.example.test' }),
    other: new ConnectionDriverDTO({ tech: Technology.SF_Prod, dbId: '00D000000000003',
        userId: '005000000000003', userName: 'fixture-other', alias: 'Other',
        dbName: 'other', instanceUrl: 'https://other.example.test' }),
};
const keyOf = config => createOrgKey(config.dbId, config.userId);

function createRepository() {
    const rows = new Map();
    const toDTO = (id, row) => new UserDTO(id, 'fixture', row.createdAt, row.expiresAt, row.connections);
    return {
        rows,
        async findUserByUserId() { return null; },
        async findUserByTokenId(id) {
            const row = rows.get(id);
            if (!row) throw new SessionError(ErrorMessages.SESSION_INVALID);
            return toDTO(id, row);
        },
        async createUserAndFirstConnection(id, expiresAt, config) {
            rows.set(id, { createdAt: new Date(), expiresAt, connections: [config] });
        },
        async addNewConnectionToUser(id, config) {
            const row = rows.get(id);
            row.connections.push(config);
            return toDTO(id, row);
        },
        async rotateSessionId(previous, next, expiresAt) {
            const row = rows.get(previous);
            rows.delete(previous);
            rows.set(next, { ...row, expiresAt });
        },
    };
}

function createFakeDriver(initial, log) {
    return {
        requestAuthorization(state) { return `https://fake.example.test/authorize?state=${state}`; },
        async login() {
            const identity = fixtures[initial.code];
            assert.ok(identity, `Unknown fake Salesforce code: ${initial.code}`);
            log.push(`login:${initial.code}`);
            return identity;
        },
        async revoke() { log.push(`revoke:${initial.code}`); },
        dispose() { log.push(`dispose:${initial.code ?? 'authorization'}`); },
    };
}

async function startJourney() {
    const repository = createRepository();
    const registry = new ConnectionRegistry();
    const sessions = new Sessions(id => registry.deleteSession(id));
    const stateStore = new OAuthStateStore();
    const driverLog = [];
    const factory = config => createFakeDriver(config, driverLog);
    const signIn = new SignInController(new SignInUseCase(repository, sessions, registry), 'TESTING');
    const request = new RequestConnectionController(
        new RequestConnectionUseCase(sessions, factory),
        new SignInUseCase(repository, sessions, registry), stateStore, 'TESTING');
    const callback = new RequestedConnectionController(
        new RequestedConnectionUseCase(repository, sessions, registry, factory), stateStore, 'TESTING');
    const disconnect = new DisconnectOrgController(new DisconnectOrgUseCase(sessions, registry));
    const select = new SelectActiveOrgController(new SelectActiveOrgUseCase(sessions, registry));
    const router = express.Router();
    router.get('/api/v1/workspace', signIn.workspace.bind(signIn));
    router.get('/api/auth/:tech', request.getNewUrlConnection.bind(request));
    router.get('/api/v1/connections/:orgKey/authorize', signIn.setUser.bind(signIn), request.getUrlConnection.bind(request));
    router.get('/api/callback', callback.salesforce.bind(callback));
    router.post('/api/v1/workspace/active-org', signIn.setUser.bind(signIn), select.do.bind(select));
    router.delete('/api/v1/workspace/orgs/:orgKey', signIn.setUser.bind(signIn), disconnect.do.bind(disconnect));
    const app = createApp({ apiRouter: router, readinessProbe: { isReady: async () => true }, environment: 'TESTING' });
    const server = await new Promise(resolve => {
        const candidate = app.listen(0, '127.0.0.1', () => resolve(candidate));
    });
    return { base: `http://127.0.0.1:${server.address().port}`, server, registry, driverLog };
}

function browser(base) {
    const cookies = new Map();
    const send = async (path, options = {}) => {
        const response = await fetch(base + path, {
            ...options, redirect: 'manual',
            headers: { ...options.headers, Cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; ') },
        });
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            for (const match of setCookie.matchAll(/(?:^|,\s*)(sfstudio_workspace|sfstudio_oauth_flow)=([^;]*)/g)) {
                if (match[2]) cookies.set(match[1], match[2]);
                else cookies.delete(match[1]);
            }
        }
        return response;
    };
    return {
        send,
        get sessionId() { return cookies.get(SESSION_COOKIE_NAME); },
        async workspace() {
            const response = await send('/api/v1/workspace');
            assert.equal(response.status, 200, 'GET workspace succeeds');
            return response.json();
        },
        async connect(code, orgKey) {
            const route = orgKey ? `/api/v1/connections/${orgKey}/authorize`
                : `/api/auth/${fixtures[code].tech}`;
            const authorize = await send(route);
            assert.equal(authorize.status, 302, `authorize ${code}`);
            const state = new URL(authorize.headers.get('location')).searchParams.get('state');
            assert.ok(state, `OAuth state for ${code}`);
            if (!orgKey && !this.sessionId) assert.ok(cookies.get(OAUTH_FLOW_COOKIE_NAME), 'new workspace binding');
            const callback = await send(`/api/callback?state=${state}&code=${code}`);
            assert.equal(callback.status, 302, `callback ${code}`);
            assert.ok(this.sessionId, `session cookie after ${code}`);
            return this.workspace();
        },
        async select(orgKey) {
            const response = await send('/api/v1/workspace/active-org', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgKey }),
            });
            assert.equal(response.status, 200, `select ${orgKey}`);
            return response.json();
        },
        async close(orgKey) {
            const response = await send(`/api/v1/workspace/orgs/${orgKey}`, { method: 'DELETE' });
            assert.equal(response.status, 200, `close ${orgKey}`);
            return response.json();
        },
    };
}

for (const run of [1, 2]) {
    describe(`Sprint 03 multi-org journey, run ${run}`, () => {
        it('connects Integration and UAT, switches, closes and reconnects while isolating another user', async () => {
            const journey = await startJourney();
            const first = browser(journey.base);
            const second = browser(journey.base);
            const integration = keyOf(fixtures.integration);
            const uat = keyOf(fixtures.uat);
            const other = keyOf(fixtures.other);
            try {
                assert.deepEqual(await first.workspace(), { version: 1, connections: [], activeOrgKey: null,
                    apiVersion: API_SF_VERSION },
                    'step 1: new workspace');
                let workspace = await first.connect('integration');
                assert.equal(workspace.activeOrgKey, integration, 'step 2: Integration is active');
                workspace = await first.connect('uat');
                assert.deepEqual(workspace.connections.map(row => [row.orgKey, row.status]),
                    [[integration, 'CONNECTED'], [uat, 'CONNECTED']], 'step 3: both orgs connected');
                workspace = await first.select(integration);
                assert.equal(workspace.activeOrgKey, integration, 'step 4: switch to Integration');
                assert.deepEqual(journey.registry.listOrgKeys(first.sessionId).sort(), [integration, uat].sort(),
                    'step 4: switching preserves both drivers');
                workspace = await first.close(integration);
                assert.equal(workspace.connections.find(row => row.orgKey === integration).status,
                    'REAUTH_REQUIRED', 'step 5: Integration is closed');
                assert.equal(workspace.connections.find(row => row.orgKey === uat).status,
                    'CONNECTED', 'step 5: UAT remains connected');
                assert.equal(journey.driverLog.filter(entry => entry === 'revoke:integration').length,
                    1, 'step 5: only Integration is revoked');
                assert.equal(journey.driverLog.includes('revoke:uat'), false,
                    'step 5: UAT credentials remain active');
                workspace = await first.connect('integration', integration);
                assert.equal(workspace.connections.find(row => row.orgKey === integration).status,
                    'CONNECTED', 'step 6: Integration reconnected');
                assert.equal(workspace.activeOrgKey, integration, 'step 6: reconnected org active');
                const otherWorkspace = await second.connect('other');
                assert.deepEqual(otherWorkspace.connections.map(row => row.orgKey), [other],
                    'step 7: other user sees only their org');
                assert.deepEqual((await first.workspace()).connections.map(row => row.orgKey),
                    [integration, uat], 'step 7: first user sees only their orgs');
                const denied = await second.send('/api/v1/workspace/active-org', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orgKey: integration }),
                });
                assert.equal(denied.status, 404, 'step 7: other user cannot select Integration');
                assert.equal((await denied.json()).error.code, 'ORG_NOT_FOUND');
                assert.notEqual(first.sessionId, second.sessionId, 'step 7: sessions remain isolated');
            } finally {
                await new Promise((resolve, reject) => journey.server.close(error => error ? reject(error) : resolve()));
            }
        });
    });
}
