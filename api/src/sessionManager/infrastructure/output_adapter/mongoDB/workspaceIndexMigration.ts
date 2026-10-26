import { Model } from 'mongoose';
import { IWorkspaceSession } from './schema/workspaceSessionSchema';

/** An older schema made `user` unique, preventing concurrent workspaces. */
export async function removeObsoleteWorkspaceOwnerIndex(model: Model<IWorkspaceSession>): Promise<void> {
    await model.init();
    const indexes = await model.collection.indexes();
    const obsolete = indexes.find(index =>
        index.name === 'user_1' && index.unique === true &&
        Object.keys(index.key).length === 1 && index.key.user === 1);
    if (obsolete) await model.collection.dropIndex('user_1');
}
