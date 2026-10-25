import { HttpMetadataInputPort } from '../../domain/ports/inbound/httpMetadataPorts';
import { ConnectionRegistryPort } from '../../domain/ports/outbound/connectionRegistryPort';
import { SessionId } from '../../domain/entities/workspaceSession';
import { parseOrgKey, OrgKey } from '../../domain/entities/orgKey';
import { Sessions } from '../../domain/entities/sessions';
import { ReauthRequiredError } from '../../domain/exceptions/reauthRequiredError';
import { ActiveConnectionPort } from '../../domain/ports/outbound/connectionRegistryPort';

function ownedOrgKey(sessions: Sessions, sessionId: SessionId, value: string): OrgKey {
    parseOrgKey(value);
    const orgKey = value as OrgKey;
    sessions.getUser(sessionId).getConnection(orgKey);
    return orgKey;
}

export class MetadataRequestUseCase implements HttpMetadataInputPort {
    constructor(private readonly sessions: Sessions, private readonly registry: ConnectionRegistryPort) {}

    private async withConnection(
        sessionId: SessionId,
        value: string,
        read: (connection: ActiveConnectionPort) => Promise<string>,
    ): Promise<string> {
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

    async doSOQL(sessionId: SessionId, orgKey: string, soql: string): Promise<string> {
        return this.withConnection(sessionId, orgKey, conn => conn.doSOQL(soql));
    }
}
