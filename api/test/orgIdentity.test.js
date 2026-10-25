const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { createOrgKey, parseOrgKey } = require('../build/sessionManager/domain/entities/orgKey');
const { UserEntity } = require('../build/sessionManager/domain/entities/UserEntity');
const { UserDTO } = require('../build/sessionManager/application/dtos/userDTO');
const { ConnectionDriverDTO, Technology } = require('../build/sessionManager/application/dtos/connectionDriverDTO');
const { migrateConnections } = require('../build/sessionManager/infrastructure/output_adapter/mongoDB/connectionMigration');

const organizationA = '00D000000000001';
const organizationB = '00D000000000002';
const userId = '005000000000001';

function connection(organizationId, alias = 'UAT') {
    return new ConnectionDriverDTO({
        tech: Technology.SF_Test,
        dbId: organizationId,
        dbName: 'same-host',
        userId,
        userName: 'fixture-user',
        alias,
        instanceUrl: 'https://example.invalid',
    });
}

describe('OrgKey and workspace contract', () => {
    it('uses both organization and user IDs, and rejects malformed keys', () => {
        const a = createOrgKey(organizationA, userId);
        const b = createOrgKey(organizationB, userId);
        assert.notEqual(a, b);
        assert.deepEqual(parseOrgKey(a), { organizationId: organizationA, userId });
        assert.throws(() => parseOrgKey('0:1'));
        assert.throws(() => createOrgKey(organizationA, ''));
    });

    it('serializes two same-alias connections independently without credentials', () => {
        const user = new UserEntity(null);
        user.loadConnections(new UserDTO(user.getSessionId(), 'fixture', new Date(), user.getExpiresAt(), [
            connection(organizationA), connection(organizationB),
        ]));
        const a = createOrgKey(organizationA, userId);
        user.setActiveOrgKey(a);
        user.setConnectionStatus(a, 'CONNECTED');
        const workspace = user.getSessionStatus().toJSON();
        assert.equal(workspace.version, 1);
        assert.equal(workspace.activeOrgKey, a);
        assert.deepEqual(workspace.connections.map(row => row.status), ['CONNECTED', 'REAUTH_REQUIRED']);
        assert.notEqual(workspace.connections[0].orgKey, workspace.connections[1].orgKey);
        assert.equal(JSON.stringify(workspace).includes('token'), false);
        assert.equal(JSON.stringify(workspace).includes('sessionId'), false);

        user.loadConnections(new UserDTO(user.getSessionId(), 'fixture', new Date(), user.getExpiresAt(), [
            connection(organizationA, 'Renamed'), connection(organizationB),
        ]));
        assert.equal(user.getSessionStatus().toJSON().connections[0].status, 'CONNECTED');
        assert.equal(user.getSessionStatus().toJSON().connections[0].orgKey, a);
        user.setConnectionStatus(a, 'CONNECTING');
        assert.equal(user.getSessionStatus().toJSON().connections[0].status, 'CONNECTING');
        user.setConnectionStatus(a, 'ERROR');
        assert.equal(user.getSessionStatus().toJSON().connections[0].status, 'ERROR');
    });
});

describe('legacy Mongo connection migration', () => {
    it('migrates verified IDs and invalidates rows without a safe OrgKey', () => {
        const valid = connection(organizationA).toDatabse();
        delete valid.contractVersion;
        delete valid.loginHost;
        const legacy = { ...valid, dbId: '', dbName: 'old-host' };
        const result = migrateConnections([legacy, valid]);
        assert.equal(result.changed, true);
        assert.equal(result.connections.length, 1);
        assert.equal(result.connections[0].contractVersion, 1);
        assert.equal(result.connections[0].loginHost, 'https://test.salesforce.com');
        assert.equal(result.connections[0].dbId, organizationA);
    });
});
