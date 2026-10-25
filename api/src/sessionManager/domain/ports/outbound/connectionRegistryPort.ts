import { OrgKey } from '../../entities/orgKey';
import { SessionId } from '../../entities/workspaceSession';

export interface ActiveConnectionPort {
    getDescribeGlobal(): Promise<string>;
    describeSObject(sobject: string): Promise<string>;
    doSOQL(query: string): Promise<string>;
    revoke(): Promise<void>;
    dispose(): void;
}

export interface ConnectionRegistryPort {
    addConnection(workspaceId: SessionId, orgKey: OrgKey, connection: ActiveConnectionPort, expiresAt: Date): void;
    getConnection(workspaceId: SessionId, orgKey: OrgKey): ActiveConnectionPort;
    listOrgKeys(workspaceId: SessionId): OrgKey[];
    removeConnection(workspaceId: SessionId, orgKey: OrgKey): void;
    rotateSession(previousId: SessionId, sessionId: SessionId, expiresAt: Date): void;
    deleteSession(workspaceId: SessionId): void;
    sweepExpired(): void;
}
