const assert = require('node:assert/strict');
const { it } = require('node:test');
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

it('scopes metadata and workspace states to the authenticated cookie', async () => {
    const registry = new ConnectionRegistry();
    const sessions = new Sessions(id => registry.deleteSession(id));
    const key = createOrgKey('00D000000000001', '005000000000001');
    const config = new ConnectionDriverDTO({
        tech: Technology.SF_Test, dbId: '00D000000000001', userId: '005000000000001',
        userName: 'fixture-user', dbName: 'integration', alias: 'Integration',
        instanceUrl: 'https://integration.my.salesforce.com',
    });
    const owner = sessions.addNewUser();
    const other = sessions.addNewUser();
    for (const user of [owner, other]) {
        user.loadConnections(new UserDTO(user.getSessionId(), 'fixture', new Date(), user.getExpiresAt(), [config]));
    }
    const driver = {
        accessToken: 'private-token',
        dispose() {},
        getDescribeGlobal: async () => 'owned metadata',
        describeSObject: async () => '',
        doSOQL: async () => '',
    };
    registry.addConnection(owner.getSessionId(), key, driver, owner.getExpiresAt());
    const signIn = new SignInController({
        getSessionStatus: async id => {
            const user = sessions.getUser(id);
            user.reconcileActiveConnections(new Set(registry.listOrgKeys(id)));
            return user.getSessionStatus();
        },
        getStatus: () => 'ok',
    });
    const metadata = new HttpMetadataControllers(new MetadataRequestUseCase(sessions, registry));
    const router = express.Router();
    router.get('/api/v1/workspace', signIn.workspace.bind(signIn));
    router.get('/api/describeGlobal/:orgKey', signIn.setUser.bind(signIn), metadata.getDescribeGlobal.bind(metadata));
    const app = createApp({ apiRouter: router, readinessProbe: { isReady: async () => true }, environment: 'TESTING' });
    const server = await new Promise(resolve => {
        const candidate = app.listen(0, '127.0.0.1', () => resolve(candidate));
    });
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const ownerHeaders = { Cookie: `${SESSION_COOKIE_NAME}=${owner.getSessionId()}` };
        const otherHeaders = { Cookie: `${SESSION_COOKIE_NAME}=${other.getSessionId()}` };
        const owned = await fetch(`${base}/api/describeGlobal/${key}`, { headers: ownerHeaders });
        assert.equal(owned.status, 200);
        assert.equal(await owned.text(), 'owned metadata');
        const denied = await fetch(`${base}/api/describeGlobal/${key}`, { headers: otherHeaders });
        assert.equal(denied.status, 401);
        assert.equal((await denied.json()).error.code, 'REAUTH_REQUIRED');
        const ownerWorkspace = await fetch(`${base}/api/v1/workspace`, { headers: ownerHeaders });
        const ownerBody = await ownerWorkspace.json();
        assert.equal(ownerBody.connections[0].status, 'CONNECTED');
        assert.equal(JSON.stringify(ownerBody).includes('private-token'), false);
        const otherWorkspace = await fetch(`${base}/api/v1/workspace`, { headers: otherHeaders });
        assert.equal((await otherWorkspace.json()).connections[0].status, 'REAUTH_REQUIRED');
        registry.deleteSession(owner.getSessionId());
        const expired = await fetch(`${base}/api/v1/workspace`, { headers: ownerHeaders });
        assert.equal((await expired.json()).connections[0].status, 'REAUTH_REQUIRED');
    } finally {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});
