const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const express = require('express');
const { createApp } = require('../build/app');
const { Sessions } = require('../build/sessionManager/domain/entities/sessions');
const { ConnectionRegistry } = require('../build/sessionManager/infrastructure/output_adapter/connectionServices/connectionRegistry');
const { createOrgKey } = require('../build/sessionManager/domain/entities/orgKey');
const { ReauthRequiredError } = require('../build/sessionManager/domain/exceptions/reauthRequiredError');
const { SessionError, ErrorMessages } = require('../build/sessionManager/domain/exceptions/sessionError');
const { ConnectionDriverDTO, Technology } = require('../build/sessionManager/application/dtos/connectionDriverDTO');
const { UserDTO } = require('../build/sessionManager/application/dtos/userDTO');
const { SignInUseCase, DisconnectOrgUseCase, SignOutUseCase, RequestedConnectionUseCase } =
    require('../build/sessionManager/application/use_cases/connectionUseCases');
const { MetadataRequestUseCase } = require('../build/sessionManager/application/use_cases/metadataUseCases');
const { SignInController, DisconnectOrgController, SignOutController } =
    require('../build/sessionManager/infrastructure/input_adapter/httpControllers');
const { HttpMetadataControllers } = require('../build/sessionManager/infrastructure/input_adapter/httpMetadataControllers');
const { SESSION_COOKIE_NAME } = require('../build/sessionManager/infrastructure/input_adapter/sessionCookie');

const orgA = createOrgKey('00D000000000001', '005000000000001');
const orgB = createOrgKey('00D000000000002', '005000000000002');
const configs = [
    new ConnectionDriverDTO({ tech: Technology.SF_Test, dbId: '00D000000000001',
        userId: '005000000000001', userName: 'fixture-a', dbName: 'integration',
        instanceUrl: 'https://integration.my.salesforce.com', alias: 'Integration' }),
    new ConnectionDriverDTO({ tech: Technology.SF_Test, dbId: '00D000000000002',
        userId: '005000000000002', userName: 'fixture-b', dbName: 'uat',
        instanceUrl: 'https://uat.my.salesforce.com', alias: 'UAT' }),
];

function fakeDriver(label) {
    return {
        accessToken: 'private-token',
        revokeCalls: 0,
        disposed: false,
        async revoke() { this.revokeCalls += 1; },
        dispose() { this.disposed = true; },
        getDescribeGlobal: async () => label,
        describeSObject: async () => label,
        doSOQL: async () => label,
    };
}

function createHarness() {
    const records = new Map();
    const repository = {
        findUserByTokenId: async id => {
            const record = records.get(id);
            if (!record) throw new SessionError(ErrorMessages.SESSION_INVALID);
            return new UserDTO(id, 'fixture', new Date(), record.expiresAt, record.connections);
        },
        deleteWorkspaceSession: async id => { records.delete(id); },
        rotateSessionId: async (oldId, newId, expiresAt) => {
            const record = records.get(oldId);
            records.delete(oldId);
            records.set(newId, { ...record, expiresAt });
        },
    };
    const registry = new ConnectionRegistry();
    const sessions = new Sessions(id => registry.deleteSession(id));
    const user = sessions.addNewUser();
    const id = user.getSessionId();
    records.set(id, { expiresAt: user.getExpiresAt(), connections: configs });
    user.loadConnections(new UserDTO(id, 'fixture', new Date(), user.getExpiresAt(), configs));
    user.setActiveOrgKey(orgA);
    const first = fakeDriver('integration');
    const second = fakeDriver('uat');
    registry.addConnection(id, orgA, first, user.getExpiresAt());
    registry.addConnection(id, orgB, second, user.getExpiresAt());
    const signIn = new SignInUseCase(repository, sessions, registry);
    return { records, repository, registry, sessions, user, id, first, second, signIn };
}

async function startApi(harness) {
    const signIn = new SignInController(harness.signIn, 'TESTING');
    const disconnect = new DisconnectOrgController(
        new DisconnectOrgUseCase(harness.sessions, harness.registry));
    const signOut = new SignOutController(
        new SignOutUseCase(harness.repository, harness.sessions, harness.registry), 'TESTING');
    const metadata = new HttpMetadataControllers(
        new MetadataRequestUseCase(harness.sessions, harness.registry));
    const router = express.Router();
    router.get('/api/v1/workspace', signIn.workspace.bind(signIn));
    router.delete('/api/v1/workspace/orgs/:orgKey', signIn.setUser.bind(signIn), disconnect.do.bind(disconnect));
    router.delete('/api/v1/workspace', signIn.setUser.bind(signIn), signOut.do.bind(signOut));
    router.get('/api/describeGlobal/:orgKey', signIn.setUser.bind(signIn), metadata.getDescribeGlobal.bind(metadata));
    const app = createApp({ apiRouter: router, readinessProbe: { isReady: async () => true }, environment: 'TESTING' });
    const server = await new Promise(resolve => {
        const candidate = app.listen(0, '127.0.0.1', () => resolve(candidate));
    });
    return { base: `http://127.0.0.1:${server.address().port}`, server };
}

describe('workspace disconnection HTTP', () => {
    it('disconnects one org idempotently and closes the whole workspace with its cookie', async () => {
        const harness = createHarness();
        const { base, server } = await startApi(harness);
        const headers = { Cookie: `${SESSION_COOKIE_NAME}=${harness.id}` };
        try {
            const url = `${base}/api/v1/workspace/orgs/${orgA}`;
            const first = await fetch(url, { method: 'DELETE', headers });
            assert.equal(first.status, 200);
            assert.deepEqual((await first.json()).connections.map(row => row.status),
                ['REAUTH_REQUIRED', 'CONNECTED']);
            assert.equal(harness.first.revokeCalls, 1);
            assert.equal(harness.first.disposed, true);
            assert.equal(harness.second.disposed, false);
            const disconnectedRead = await fetch(`${base}/api/describeGlobal/${orgA}`, { headers });
            assert.equal(disconnectedRead.status, 401);
            assert.equal((await disconnectedRead.json()).error.code, 'REAUTH_REQUIRED');
            const repeat = await fetch(url, { method: 'DELETE', headers });
            assert.equal(repeat.status, 200);
            assert.equal(harness.first.revokeCalls, 1);
            const other = await fetch(`${base}/api/describeGlobal/${orgB}`, { headers });
            assert.equal(await other.text(), 'uat');

            const closed = await fetch(`${base}/api/v1/workspace`, { method: 'DELETE', headers });
            assert.equal(closed.status, 204);
            assert.match(closed.headers.get('set-cookie'), new RegExp(`^${SESSION_COOKIE_NAME}=;`));
            assert.equal(harness.second.revokeCalls, 1);
            assert.equal(harness.second.disposed, true);
            assert.equal(harness.records.size, 0);
            const oldCookie = await fetch(`${base}/api/v1/workspace`, { headers });
            assert.equal(oldCookie.status, 401);
            assert.equal((await oldCookie.json()).error.code, 'SESSION_INVALID');
        } finally {
            await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        }
    });

    it('rejects an unknown org without affecting another connection', async () => {
        const harness = createHarness();
        const { base, server } = await startApi(harness);
        try {
            const response = await fetch(`${base}/api/v1/workspace/orgs/00D000000000003:005000000000003`, {
                method: 'DELETE', headers: { Cookie: `${SESSION_COOKIE_NAME}=${harness.id}` },
            });
            assert.equal(response.status, 404);
            assert.equal((await response.json()).error.code, 'ORG_NOT_FOUND');
            assert.deepEqual(harness.registry.listOrgKeys(harness.id), [orgA, orgB]);
        } finally {
            await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        }
    });
});

describe('reauthentication after loss of an active driver', () => {
    it('keeps Mongo-known identities after a restart and reconnects the same OrgKey', async () => {
        const harness = createHarness();
        const restartedRegistry = new ConnectionRegistry();
        const restartedSessions = new Sessions(id => restartedRegistry.deleteSession(id));
        const signIn = new SignInUseCase(harness.repository, restartedSessions, restartedRegistry);
        const afterRestart = (await signIn.getSessionStatus(harness.id)).toJSON();
        assert.deepEqual(afterRestart.connections.map(row => row.status),
            ['REAUTH_REQUIRED', 'REAUTH_REQUIRED']);
        assert.deepEqual(afterRestart.connections.map(row => row.orgKey), [orgA, orgB]);
        const driver = fakeDriver('integration reconnected');
        driver.login = async () => configs[0];
        const requested = new RequestedConnectionUseCase(
            harness.repository, restartedSessions, restartedRegistry, () => driver);
        const rotated = await requested.exe(harness.id,
            new ConnectionDriverDTO({ tech: Technology.SF_Test, code: 'fixture-code' }), orgA);
        const reconnected = (await signIn.getSessionStatus(rotated)).toJSON();
        assert.deepEqual(reconnected.connections.map(row => row.status),
            ['CONNECTED', 'REAUTH_REQUIRED']);
        assert.deepEqual(reconnected.connections.map(row => row.orgKey), [orgA, orgB]);
    });

    it('turns an expired Salesforce token into REAUTH_REQUIRED and removes only that driver', async () => {
        const harness = createHarness();
        harness.first.getDescribeGlobal = async () => { throw new ReauthRequiredError(); };
        const metadata = new MetadataRequestUseCase(harness.sessions, harness.registry);
        await assert.rejects(() => metadata.getDescribeGlobal(harness.id, orgA), ReauthRequiredError);
        assert.equal(harness.first.disposed, true);
        assert.equal(harness.second.disposed, false);
        assert.deepEqual((await harness.signIn.getSessionStatus(harness.id)).toJSON()
            .connections.map(row => row.status), ['REAUTH_REQUIRED', 'CONNECTED']);
    });
});
