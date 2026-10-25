const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { randomUUID } = require('node:crypto');
const { ConnectionRegistry } = require('../build/sessionManager/infrastructure/output_adapter/connectionServices/connectionRegistry');
const { ReauthRequiredError } = require('../build/sessionManager/domain/exceptions/reauthRequiredError');
const { Sessions } = require('../build/sessionManager/domain/entities/sessions');
const { createOrgKey } = require('../build/sessionManager/domain/entities/orgKey');
const { UserDTO } = require('../build/sessionManager/application/dtos/userDTO');
const { ConnectionDriverDTO, Technology } = require('../build/sessionManager/application/dtos/connectionDriverDTO');
const { SignInUseCase, RequestedConnectionUseCase } = require('../build/sessionManager/application/use_cases/connectionUseCases');
const { MetadataRequestUseCase } = require('../build/sessionManager/application/use_cases/metadataUseCases');

const orgA = createOrgKey('00D000000000001', '005000000000001');
const orgB = createOrgKey('00D000000000002', '005000000000002');

function fakeDriver(label) {
    return {
        disposed: false,
        dispose() { this.disposed = true; },
        getDescribeGlobal: async () => label,
        describeSObject: async () => label,
        doSOQL: async () => label,
    };
}

describe('ConnectionRegistry', () => {
    it('keeps two orgs in one workspace and isolates another concurrent workspace', () => {
        const registry = new ConnectionRegistry();
        const workspaceA = randomUUID();
        const workspaceB = randomUUID();
        const expiresAt = new Date(Date.now() + 60_000);
        const integration = fakeDriver('integration');
        const uat = fakeDriver('uat');
        registry.addConnection(workspaceA, orgA, integration, expiresAt);
        registry.addConnection(workspaceA, orgB, uat, expiresAt);
        assert.deepEqual(registry.listOrgKeys(workspaceA), [orgA, orgB]);
        assert.equal(registry.getConnection(workspaceA, orgA), integration);
        assert.equal(registry.getConnection(workspaceA, orgB), uat);
        assert.deepEqual(registry.listOrgKeys(workspaceB), []);
        assert.throws(() => registry.getConnection(workspaceB, orgA), ReauthRequiredError);

        const rotated = randomUUID();
        registry.rotateSession(workspaceA, rotated, expiresAt);
        assert.deepEqual(registry.listOrgKeys(workspaceA), []);
        assert.deepEqual(registry.listOrgKeys(rotated), [orgA, orgB]);
        registry.deleteSession(rotated);
        assert.equal(integration.disposed, true);
        assert.equal(uat.disposed, true);
    });

    it('replaces only one driver and disposes expired connections', () => {
        let now = 1_000;
        const registry = new ConnectionRegistry(() => now);
        const workspace = randomUUID();
        const first = fakeDriver('first');
        const replacement = fakeDriver('replacement');
        const other = fakeDriver('other');
        registry.addConnection(workspace, orgA, first, new Date(2_000));
        registry.addConnection(workspace, orgB, other, new Date(2_000));
        registry.addConnection(workspace, orgA, replacement, new Date(2_000));
        assert.equal(first.disposed, true);
        assert.equal(other.disposed, false);
        registry.removeConnection(workspace, orgA);
        assert.equal(replacement.disposed, true);
        assert.deepEqual(registry.listOrgKeys(workspace), [orgB]);
        now = 2_000;
        registry.sweepExpired();
        assert.deepEqual(registry.listOrgKeys(workspace), []);
        assert.equal(other.disposed, true);
        assert.throws(() => registry.getConnection(workspace, orgA), ReauthRequiredError);
    });
});

describe('multi-org use cases with fake OAuth drivers', () => {
    it('keeps both active through rotation and returns only the current workspace drivers', async () => {
        const records = new Map();
        const configurations = {
            integration: new ConnectionDriverDTO({
                tech: Technology.SF_Test, dbId: '00D000000000001', userId: '005000000000001',
                userName: 'fixture-a', dbName: 'integration', alias: 'Integration',
                instanceUrl: 'https://integration.my.salesforce.com',
            }),
            uat: new ConnectionDriverDTO({
                tech: Technology.SF_Test, dbId: '00D000000000002', userId: '005000000000002',
                userName: 'fixture-b', dbName: 'uat', alias: 'UAT',
                instanceUrl: 'https://uat.my.salesforce.com',
            }),
        };
        const repository = {
            findUserByUserId: async () => null,
            createUserAndFirstConnection: async (id, expiresAt, config) => {
                records.set(id, { expiresAt, connections: [config] });
            },
            addNewConnectionToUser: async (id, config) => {
                const record = records.get(id);
                record.connections.push(config);
                return new UserDTO(id, 'fixture', new Date(), record.expiresAt, record.connections);
            },
            findUserByTokenId: async id => {
                const record = records.get(id);
                if (!record) throw new Error('missing fake workspace');
                return new UserDTO(id, 'fixture', new Date(), record.expiresAt, record.connections);
            },
            rotateSessionId: async (previousId, id, expiresAt) => {
                const record = records.get(previousId);
                records.delete(previousId);
                records.set(id, { ...record, expiresAt });
            },
        };
        const registry = new ConnectionRegistry();
        const sessions = new Sessions(id => registry.deleteSession(id));
        const drivers = [];
        const createDriver = initial => {
            const driver = fakeDriver(initial.code);
            driver.accessToken = 'must-not-leak-access-token';
            driver.refreshToken = 'must-not-leak-refresh-token';
            driver.login = async () => configurations[initial.code];
            drivers.push(driver);
            return driver;
        };
        const requested = new RequestedConnectionUseCase(repository, sessions, registry, createDriver);
        const signIn = new SignInUseCase(repository, sessions, registry);
        const metadata = new MetadataRequestUseCase(sessions, registry);

        const firstWorkspace = await requested.exe(undefined,
            new ConnectionDriverDTO({ tech: Technology.SF_Test, code: 'integration' }));
        const secondWorkspace = await requested.exe(firstWorkspace,
            new ConnectionDriverDTO({ tech: Technology.SF_Test, code: 'uat' }));
        const publicWorkspace = (await signIn.getSessionStatus(secondWorkspace)).toJSON();
        assert.equal(publicWorkspace.connections.length, 2);
        assert.deepEqual(publicWorkspace.connections.map(row => row.status), ['CONNECTED', 'CONNECTED']);
        assert.equal(JSON.stringify(publicWorkspace).includes('must-not-leak'), false);
        assert.equal(await metadata.getDescribeGlobal(secondWorkspace, orgA), 'integration');
        assert.equal(await metadata.getDescribeGlobal(secondWorkspace, orgB), 'uat');
        assert.deepEqual(registry.listOrgKeys(firstWorkspace), []);

        const otherWorkspace = sessions.addNewUser();
        const otherId = otherWorkspace.getSessionId();
        otherWorkspace.loadConnections(new UserDTO(otherId, 'fixture', new Date(), otherWorkspace.getExpiresAt(),
            [configurations.integration]));
        assert.equal((await signIn.getSessionStatus(otherId)).toJSON().connections[0].status, 'REAUTH_REQUIRED');
        await assert.rejects(() => metadata.getDescribeGlobal(otherId, orgA), ReauthRequiredError);
        sessions.deleteSession(secondWorkspace);
        assert.equal(drivers.every(driver => driver.disposed), true);
    });
});
