import { SessionDTO } from '../../dtos/sessionDTO';
import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';
import { SessionId } from '../../entities/workspaceSession';

export interface SignInInputPort {
    getSessionStatus(sessionId: SessionId): Promise<SessionDTO>;
    getStatus(): string;
}

export interface RequestConnectionInputPort {
    toNewConnection(connectionDriverDTO: ConnectionDriverDTO): string;
    toConfiguredConnection(sessionId: SessionId, connectionID: number): string;
}

export interface RequestedConnectionInputPort {
    exe(sessionId: SessionId | undefined, configDriverDTO: ConnectionDriverDTO): Promise<SessionId>;
}

export interface SignOutInputPort {
    exe(id: SessionId): Promise<SessionDTO>;
}
