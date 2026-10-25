import { UserDTO } from '../../../application/dtos/userDTO';
import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';
import { SessionId } from '../../entities/workspaceSession';

export interface UserRepositoryPort {
    createUserAndFirstConnection(sessionId: SessionId, expiresAt: Date, configDriverDTO: ConnectionDriverDTO): Promise<void>;
    addNewConnectionToUser(sessionId: SessionId, configDriverDTO: ConnectionDriverDTO): Promise<UserDTO>;
    findUserByTokenId(tokenId: SessionId): Promise<UserDTO>;
    findUserByUserId(configDriverDTO: ConnectionDriverDTO): Promise<UserDTO | null>;    
    rotateSessionId(previousId: SessionId, sessionId: SessionId, expiresAt: Date): Promise<void>;
}

