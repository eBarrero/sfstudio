import { HttpMetadataInputPort } from '../../domain/ports/inbound/httpMetadataPorts';
import { ConnectionRegistryPort } from '../../domain/ports/outbound/connectionRegistryPort';
import { SessionId } from '../../domain/entities/workspaceSession';
import { parseOrgKey, OrgKey } from '../../domain/entities/orgKey';
import { Sessions } from '../../domain/entities/sessions';
import { ReauthRequiredError } from '../../domain/exceptions/reauthRequiredError';
import { SessionError } from '../../domain/exceptions/sessionError';
import { randomUUID } from 'node:crypto';
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
    private readonly cursors = new Map<string, { sessionId: SessionId; orgKey: OrgKey;
        locator: string; limit: number; remaining: number; expiresAt: number }>();
    constructor(private readonly sessions: Sessions, private readonly registry: ConnectionRegistryPort) {}

    clearWorkspace(sessionId: SessionId): void {
        for (const [token, entry] of this.cursors) {
            if (entry.sessionId === sessionId) this.cursors.delete(token);
        }
    }

    private queryOrgKey(sessionId: SessionId, orgKey: unknown): OrgKey {
        if (typeof orgKey !== 'string') throw new QueryRequestError('ORG_KEY_INVALID', 400);
        try { return ownedOrgKey(this.sessions, sessionId, orgKey); }
        catch (error) {
            if (error instanceof SessionError) throw new QueryRequestError('ORG_NOT_FOUND', 404);
            throw new QueryRequestError('ORG_KEY_INVALID', 400);
        }
    }

    private publicPage(page: { done: boolean; totalSize: number; records: Record<string, unknown>[];
        nextRecordsUrl?: string }, sessionId: SessionId, orgKey: OrgKey, limit: number, remaining: number): PublicQueryPage {
        const records = page.records.slice(0, remaining);
        const left = remaining - records.length;
        const result: PublicQueryPage = { done: page.done || left === 0 || !page.nextRecordsUrl, totalSize: page.totalSize,
            records, limit };
        if (!result.done && page.nextRecordsUrl) {
            const locator = page.nextRecordsUrl.split('/').pop();
            if (!locator || !/^[A-Za-z0-9-]+$/.test(locator)) throw new QueryRequestError('QUERY_FAILED', 502);
            for (const [token, entry] of this.cursors) if (entry.expiresAt <= Date.now()) this.cursors.delete(token);
            const cursor = randomUUID();
            this.cursors.set(cursor, { sessionId, orgKey, locator, limit, remaining: left,
                expiresAt: Date.now() + 5 * 60_000 });
            result.cursor = cursor;
        }
        return result;
    }

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
        const safe = enforceReadOnlySoql(query, limit);
        const key = this.queryOrgKey(sessionId, orgKey);
        const result = await this.withConnection(sessionId, key, conn => conn.doSOQL(safe.query));
        return this.publicPage(result, sessionId, key, safe.limit, safe.limit);
    }

    async nextQueryPage(sessionId: SessionId, orgKey: unknown, cursor: unknown): Promise<PublicQueryPage> {
        const key = this.queryOrgKey(sessionId, orgKey);
        if (typeof cursor !== 'string') throw new QueryRequestError('QUERY_CURSOR_INVALID', 400);
        const saved = this.cursors.get(cursor);
        if (!saved || saved.sessionId !== sessionId || saved.orgKey !== key || saved.expiresAt <= Date.now())
            throw new QueryRequestError('QUERY_CURSOR_INVALID', 400);
        this.cursors.delete(cursor);
        const result = await this.withConnection(sessionId, key, conn => conn.queryMore(saved.locator));
        return this.publicPage(result, sessionId, key, saved.limit, saved.remaining);
    }
}
