import { createOrgKey } from '../../../domain/entities/orgKey';
import { IConnection } from './schema/userSchema';
import { salesforceLoginHost } from '../../../domain/entities/salesforceLoginHost';

/** Legacy rows with no verified Salesforce IDs cannot be assigned an OrgKey. */
export function migrateConnections(rows: IConnection[]): { connections: IConnection[]; changed: boolean } {
    const connections: IConnection[] = [];
    const seen = new Set<string>();
    let changed = false;
    for (const row of rows) {
        let key: string;
        try {
            key = createOrgKey(row.dbId, row.userId);
            salesforceLoginHost(row.tech);
        } catch {
            changed = true;
            continue;
        }
        if (seen.has(key)) {
            changed = true;
            continue;
        }
        seen.add(key);
        const loginHost = salesforceLoginHost(row.tech);
        const migrated: IConnection = {
            tech: row.tech,
            userId: row.userId,
            userName: row.userName,
            email: row.email,
            dbId: row.dbId,
            dbName: row.dbName,
            instanceUrl: row.instanceUrl,
            alias: row.alias,
            loginHost,
            contractVersion: 1,
        };
        if (row.contractVersion !== 1 || row.loginHost !== loginHost) changed = true;
        connections.push(migrated);
    }
    return { connections, changed };
}
