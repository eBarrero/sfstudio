import { HttpMetadataInputPort } from '../../domain/ports/inbound/httpMetadataPorts';
import ConnectionPool from '../../infrastructure/output_adapter/connectionServices/connectionPool';
import { SessionId } from '../../domain/entities/workspaceSession';
import { parseOrgKey, OrgKey } from '../../domain/entities/orgKey';
import { sessions } from '../../domain/entities/sessions';

function ownedOrgKey(sessionId: SessionId, value: string): OrgKey {
    parseOrgKey(value);
    const orgKey = value as OrgKey;
    sessions.getUser(sessionId).getConnection(orgKey);
    return orgKey;
}

export class MetadataRequestUseCase implements HttpMetadataInputPort {
    
    async getDescribeGlobal(sessionId: SessionId, orgKey: string): Promise<string> {
        const conn = ConnectionPool.getConnection(sessionId, ownedOrgKey(sessionId, orgKey));
        return conn.getDescribeGlobal();
    }

    async describeSObject(sessionId: SessionId, orgKey: string, sobject: string): Promise<string> {
        const conn = ConnectionPool.getConnection(sessionId, ownedOrgKey(sessionId, orgKey));
        return conn.describeSObject(sobject);
    }

    async doSOQL(sessionId: SessionId, orgKey: string, soql: string): Promise<string> {
        const conn = ConnectionPool.getConnection(sessionId, ownedOrgKey(sessionId, orgKey));
        return conn.doSOQL(soql);
    }
}
