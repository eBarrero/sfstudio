const assert = require('node:assert/strict');
const { it } = require('node:test');
const { removeObsoleteWorkspaceOwnerIndex } = require('../build/sessionManager/infrastructure/output_adapter/mongoDB/workspaceIndexMigration');

it('removes only the legacy unique owner index for concurrent workspaces', async () => {
    const dropped = [];
    const model = {
        init: async () => {},
        collection: {
            indexes: async () => [
                { name: '_id_', unique: true, key: { _id: 1 } },
                { name: 'sessionId_1', unique: true, key: { sessionId: 1 } },
                { name: 'user_1', unique: true, key: { user: 1 } },
            ],
            dropIndex: async name => { dropped.push(name); },
        },
    };
    await removeObsoleteWorkspaceOwnerIndex(model);
    assert.deepEqual(dropped, ['user_1']);
    model.collection.indexes = async () => [{ name: 'user_1', key: { user: 1 } }];
    await removeObsoleteWorkspaceOwnerIndex(model);
    assert.deepEqual(dropped, ['user_1']);
});
