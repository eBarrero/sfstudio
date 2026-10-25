import { SessionDTO } from '../../dtos/sessionDTO';
import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';
import { SessionId } from '../../entities/workspaceSession';
import { OrgKey } from '../../entities/orgKey';

export interface SignInInputPort {
    getSessionStatus(sessionId: SessionId): Promise<SessionDTO>;
    getStatus(): string;
}

export interface RequestConnectionInputPort {
    toNewConnection(connectionDriverDTO: ConnectionDriverDTO, state: string): string;
    getConfiguredTechnology(sessionId: SessionId, orgKey: OrgKey): string;
    toConfiguredConnection(sessionId: SessionId, orgKey: OrgKey, state: string): string;
}

export interface RequestedConnectionInputPort {
    exe(sessionId: SessionId | undefined, configDriverDTO: ConnectionDriverDTO, expectedOrgKey?: OrgKey): Promise<SessionId>;
}

export interface SignOutInputPort {
    exe(id: SessionId): Promise<SessionDTO>;
}
