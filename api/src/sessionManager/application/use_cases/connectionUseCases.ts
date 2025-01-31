
import { sessions }  from '../../domain/entities/sessions';

import { SessionDTO } from '../../domain/dtos/sessionDTO';
import { SignInInputPort, RequestConnectionInputPort, RequestedConnectionInputPort, SignOutInputPort } from '../../domain/ports/inbound/httpInputPorts';
import { UserRepositoryPort } from '../../domain/ports/outbound/userRepositoryPort';
import { SessionError } from '../../domain/exceptions/sessionError';
import { ConnectionDriverDTO } from '../dtos/connectionDriverDTO';
import ConnectionDriverFactory  from '../../infrastructure/output_adapter/connectionServices/connectionDriverFactory';
import connectionPool from '../../infrastructure/output_adapter/connectionServices/connectionPool';


export class SignInUseCase implements SignInInputPort {
    constructor(private userRepository: UserRepositoryPort) {}

    async getSessionStatus(sessionId: number): Promise<SessionDTO> {
        const user = sessions.lookUpUserOnCache(sessionId);
        if (user) {
            if (!user.getPendingToUpdate()) {
                return user.getSessionStatus();
            } else {
                const userDTO = await this.userRepository.findUserByTokenId(sessionId);
                user.loadConnections(userDTO);
                user.setPendingToUpdate(false);
                return user.getSessionStatus();
            }
        }
        
        const userDTO = await this.userRepository.findUserByTokenId(sessionId);
        const newUer = sessions.rebuildUser(sessionId);
        
        newUer.loadConnections(userDTO);
        return newUer.getSessionStatus();
    }
    getStatus(): string {
        return 'ok';
    } 
}

export class RequestConnectionUseCase implements RequestConnectionInputPort {
    constructor(private userRepository: UserRepositoryPort) {}

    toNewConnection(configDriverDTO: ConnectionDriverDTO): string {
        const driver = ConnectionDriverFactory.createDriver(configDriverDTO);
        return driver.requestAuthorization();
    }

    toConfiguredConnection(sessionId: number, connectionId: number): string {
        console.log(`toConfiguredConnection ${sessionId} ${connectionId}`);
        const connection = sessions.getUser(sessionId).getConnection(connectionId);
        if (connection) {
            const driver = ConnectionDriverFactory.createDriver(connection.getConnectionDriverConfig());
            return driver.requestAuthorization();
        }
        throw new SessionError(`Connection not found with id ${connectionId}`);
    }
}

export class RequestedConnectionUseCase implements RequestedConnectionInputPort {
    constructor(private userRepository: UserRepositoryPort) {}
    async exe(sessionId: number | undefined, initialConfigDriverDTO: ConnectionDriverDTO): Promise<number> {
        console.log(`RequestedConnectionUseCase ${sessionId}`);

        const driver = ConnectionDriverFactory.createDriver(initialConfigDriverDTO);
        const configDriverDTO = await driver.login();
        
        let user = (sessionId) ? sessions.getUser(sessionId) : sessions.addNewUser();
        if (!sessionId) {
            const userDTO = await this.userRepository.findUserByUserId(configDriverDTO);
            if (userDTO) {
                user = sessions.rebuildUser(userDTO.sessionId);
                user.loadConnections(userDTO);
            } else {
                user = sessions.addNewUser();
                this.userRepository.crateUserAndFirstConnection(user.getSessionId(), configDriverDTO)
            }
            user.setPendingToUpdate(true);
        } else {
            if (!user.checkConnectionExists(configDriverDTO.dbName!)) {
                const userDTO = await this.userRepository.addNewConnectionToUser(user.getSessionId(), configDriverDTO);
                user.loadConnections(userDTO);
            }
        }

        user.setcurrentConnection(configDriverDTO.dbName!);
        connectionPool.addConnection(user.getSessionId(), configDriverDTO.dbName!,  driver);
        user.setConnectionAsOpen(configDriverDTO.dbName!);
        console.log(user);
        return user.getSessionId();
    }
}

export class SignOutUseCase implements SignOutInputPort {
    constructor(private userRepository: UserRepositoryPort) {}

    async exe(id: number): Promise<SessionDTO> {
        const user = sessions.lookUpUserOnCache(id);
        if (user) {
            user.signOut();
            return user.getSessionStatus();
        }
        throw new SessionError(`Session not found with id ${id}`);
    }
}


