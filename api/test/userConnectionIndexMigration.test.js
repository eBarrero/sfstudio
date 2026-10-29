const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { removeObsoleteUserConnectionIndexes } = require('../build/sessionManager/infrastructure/output_adapter/mongoDB/userConnectionIndexMigration');
const { MongoDBUserRepository } = require('../build/sessionManager/infrastructure/output_adapter/mongoDB/mongoDBUserRepository');
const { ConnectionDriverDTO, Technology } = require('../build/sessionManager/application/dtos/connectionDriverDTO');

const indexes = [
    { name: '_id_', unique: true, key: { _id: 1 } },
    { name: 'sessionId_1', unique: true, key: { sessionId: 1 } },
    { name: 'connections.userId_1', unique: true, key: { 'connections.userId': 1 } },
    { name: 'connections.userName_1', unique: true, key: { 'connections.userName': 1 } },
    { name: 'connections.dbId_1_connections.userId_1', unique: true,
        key: { 'connections.dbId': 1, 'connections.userId': 1 } },
];

describe('legacy user connection indexes', () => {
    it('drops only the two obsolete single-field unique indexes and is idempotent', async () => {
        const present = [...indexes];
        const dropped = [];
        const model = {
            init: async () => {},
            collection: {
                indexes: async () => present,
                dropIndex: async name => {
                    dropped.push(name);
                    present.splice(present.findIndex(index => index.name === name), 1);
                },
            },
        };
        await removeObsoleteUserConnectionIndexes(model);
        await removeObsoleteUserConnectionIndexes(model);
        assert.deepEqual(dropped, ['connections.userId_1', 'connections.userName_1']);
        assert.deepEqual(present.map(index => index.name), [
            '_id_', 'sessionId_1', 'connections.dbId_1_connections.userId_1',
        ]);
    });

    it('removes the legacy indexes before inserting a known Salesforce user', async () => {
        const present = [...indexes];
        const dropped = [];
        class UserModel {
            static init = async () => {};
            static collection = {
                indexes: async () => present,
                dropIndex: async name => {
                    dropped.push(name);
                    present.splice(present.findIndex(index => index.name === name), 1);
                },
            };
            constructor(data) { this.data = data; this._id = 'fixture-user-id'; }
            async save() {
                assert.equal(present.some(index => index.name === 'connections.userId_1'), false);
                assert.equal(present.some(index => index.name === 'connections.userName_1'), false);
            }
        }
        class WorkspaceSessionModel {
            static init = async () => {};
            static collection = { indexes: async () => [], dropIndex: async () => {} };
            async save() {}
        }
        const connection = {
            model: name => name === 'User' ? UserModel : WorkspaceSessionModel,
        };
        const repository = new MongoDBUserRepository({ getConnection: () => connection });
        const config = new ConnectionDriverDTO({ tech: Technology.SF_Test,
            dbId: '00D000000000001', userId: '005000000000001', userName: 'fixture',
            dbName: 'integration', instanceUrl: 'https://integration.my.salesforce.com' });
        await repository.createUserAndFirstConnection('fixture-session', new Date(Date.now() + 60000), config);
        assert.deepEqual(dropped, ['connections.userId_1', 'connections.userName_1']);
    });
});
