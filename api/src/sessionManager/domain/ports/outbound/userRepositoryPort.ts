import { UserDTO } from '../../../application/dtos/userDTO';
import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';

export interface UserRepositoryPort {
    crateUserAndFirstConnection(sessionId: number, configDriverDTO: ConnectionDriverDTO ): Promise<void>;
    addNewConnectionToUser(sessionId: number, configDriverDTO: ConnectionDriverDTO ): Promise<void>;
    findUserByTokenId(tokenId: number): Promise<UserDTO>;
    findUserByUserId(configDriverDTO: ConnectionDriverDTO): Promise<UserDTO | null>;    
}

