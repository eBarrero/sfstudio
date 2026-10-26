import { HttpMetadataInputPort } from '../../domain/ports/inbound/httpMetadataPorts';
import { ConnectionRegistryPort } from '../../domain/ports/outbound/connectionRegistryPort';
import { SessionId } from '../../domain/entities/workspaceSession';
import { parseOrgKey, OrgKey } from '../../domain/entities/orgKey';
import { Sessions } from '../../domain/entities/sessions';
import { ReauthRequiredError } from '../../domain/exceptions/reauthRequiredError';
import { SessionError } from '../../domain/exceptions/sessionError';
import { ActiveConnectionPort } from '../../domain/ports/outbound/connectionRegistryPort';
import { PublicQueryPage, QueryRequestError } from '../../domain/entities/queryContract';
import { enforceReadOnlySoql } from '../../domain/entities/readonlySoql';

function ownedOrgKey(sessions: Sessions, sessionId: SessionId, value: string): OrgKey {
    parseOrgKey(value);
    const orgKey = value as OrgKey;
    sessions.getUser(sessionId).getConnection(orgKey);
    return orgKey;
}

export class MetadataRequestUseCase implements HttpMetadataInputPort {
    constructor(private readonly sessions: Sessions, private readonly registry: ConnectionRegistryPort) {}

    private async withConnection<T>(
        sessionId: SessionId,
        value: string,
        read: (connection: ActiveConnectionPort) => Promise<T>,
    ): Promise<T> {
        const orgKey = ownedOrgKey(this.sessions, sessionId, value);
        try {
            return await read(this.registry.getConnection(sessionId, orgKey));
        } catch (error) {
            if (error instanceof ReauthRequiredError) {
                this.registry.removeConnection(sessionId, orgKey);
                this.sessions.getUser(sessionId).disconnectOrg(orgKey);
            }
            throw error;
        }
    }
    
    async getDescribeGlobal(sessionId: SessionId, orgKey: string): Promise<string> {
        return this.withConnection(sessionId, orgKey, conn => conn.getDescribeGlobal());
    }

    async describeSObject(sessionId: SessionId, orgKey: string, sobject: string): Promise<string> {
        return this.withConnection(sessionId, orgKey, conn => conn.describeSObject(sobject));
    }

    async runQuery(sessionId: SessionId, orgKey: unknown, query: unknown, limit: unknown): Promise<PublicQueryPage> {
        if (typeof orgKey !== 'string') throw new QueryRequestError('ORG_KEY_INVALID', 400);
        const safe = enforceReadOnlySoql(query, limit);
        let key: OrgKey;
        try { key = ownedOrgKey(this.sessions, sessionId, orgKey); }
        catch (error) {
            if (error instanceof SessionError) throw new QueryRequestError('ORG_NOT_FOUND', 404);
            throw new QueryRequestError('ORG_KEY_INVALID', 400);
        }
        const result = await this.withConnection(sessionId, key, conn => conn.doSOQL(safe.query));
        return { done: result.done, totalSize: result.totalSize, records: result.records, limit: safe.limit };
    }
}
