import { SessionDTO } from '../../dtos/sessionDTO';
import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';

export interface SignInInputPort {
    getSessionStatus(sessionId: number): Promise<SessionDTO>;
    getStatus(): string;
}

export interface RequestConnectionInputPort {
    toNewConnection(connectionDriverDTO: ConnectionDriverDTO): string;
    toConfiguredConnection(sessionId: number, connectionID: number): string;   
}

export interface RequestedConnectionInputPort {
    exe(sessionId: number | undefined, configDriverDTO: ConnectionDriverDTO): Promise<number>;
}

export interface SignOutInputPort {
    exe(id: number): Promise<SessionDTO>;
}
