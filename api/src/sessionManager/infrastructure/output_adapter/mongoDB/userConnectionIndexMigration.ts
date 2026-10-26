import { Model } from 'mongoose';
import { IUser } from './schema/userSchema';

/** Older schemas made connection fields unique across all user documents. */
export async function removeObsoleteUserConnectionIndexes(model: Model<IUser>): Promise<void> {
    await model.init();
    const indexes = await model.collection.indexes();
    for (const field of ['connections.userId', 'connections.userName'] as const) {
        const name = `${field}_1`;
        const obsolete = indexes.find(index =>
            index.name === name && index.unique === true &&
            Object.keys(index.key).length === 1 && index.key[field] === 1);
        if (obsolete) await model.collection.dropIndex(name);
    }
}
