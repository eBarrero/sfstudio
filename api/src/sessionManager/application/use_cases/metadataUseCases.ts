import { HttpMetadataInputPort } from '../../domain/ports/inbound/httpMetadataPorts';
import { ConnectionRegistryPort } from '../../domain/ports/outbound/connectionRegistryPort';
import { SessionId } from '../../domain/entities/workspaceSession';
import { parseOrgKey, OrgKey } from '../../domain/entities/orgKey';
import { Sessions } from '../../domain/entities/sessions';

function ownedOrgKey(sessions: Sessions, sessionId: SessionId, value: string): OrgKey {
    parseOrgKey(value);
    const orgKey = value as OrgKey;
    sessions.getUser(sessionId).getConnection(orgKey);
    return orgKey;
}

export class MetadataRequestUseCase implements HttpMetadataInputPort {
    constructor(private readonly sessions: Sessions, private readonly registry: ConnectionRegistryPort) {}
    
    async getDescribeGlobal(sessionId: SessionId, orgKey: string): Promise<string> {
        const conn = this.registry.getConnection(sessionId, ownedOrgKey(this.sessions, sessionId, orgKey));
        return conn.getDescribeGlobal();
    }

    async describeSObject(sessionId: SessionId, orgKey: string, sobject: string): Promise<string> {
        const conn = this.registry.getConnection(sessionId, ownedOrgKey(this.sessions, sessionId, orgKey));
        return conn.describeSObject(sobject);
    }

    async doSOQL(sessionId: SessionId, orgKey: string, soql: string): Promise<string> {
        const conn = this.registry.getConnection(sessionId, ownedOrgKey(this.sessions, sessionId, orgKey));
        return conn.doSOQL(soql);
    }
}
