
import { sessions }  from '../../domain/entities/sessions';

import { SessionDTO } from '../../domain/dtos/sessionDTO';
import { SignInInputPort, RequestConnectionInputPort, RequestedConnectionInputPort, SignOutInputPort } from '../../domain/ports/inbound/httpInputPorts';
import { UserRepositoryPort } from '../../domain/ports/outbound/userRepositoryPort';
import { SessionError } from '../../domain/exceptions/sessionError';
import { ConnectionDriverDTO } from '../dtos/connectionDriverDTO';
import ConnectionDriverFactory  from '../../infrastructure/output_adapter/connectionServices/connectionDriverFactory';
import connectionPool from '../../infrastructure/output_adapter/connectionServices/connectionPool';
import { SessionId } from '../../domain/entities/workspaceSession';
import { UserEntity } from '../../domain/entities/UserEntity';
import { createOrgKey, OrgKey } from '../../domain/entities/orgKey';
import { validateSalesforceLoginHost } from '../../domain/entities/salesforceLoginHost';


export class SignInUseCase implements SignInInputPort {
    constructor(private userRepository: UserRepositoryPort) {}

    async getSessionStatus(sessionId: SessionId): Promise<SessionDTO> {
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
        const newUer = sessions.rebuildUser(sessionId, userDTO.expiresAt);
        
        newUer.loadConnections(userDTO);
        return newUer.getSessionStatus();
    }
    getStatus(): string {
        return 'ok';
    } 
}

export class RequestConnectionUseCase implements RequestConnectionInputPort {
    toNewConnection(configDriverDTO: ConnectionDriverDTO, state: string): string {
        const driver = ConnectionDriverFactory.createDriver(configDriverDTO);
        return driver.requestAuthorization(state);
    }

    getConfiguredOAuthContext(sessionId: SessionId, orgKey: OrgKey) {
        const config = sessions.getUser(sessionId).getConnection(orgKey).getConnectionDriverConfig();
        return {
            technology: config.tech!,
            loginHost: validateSalesforceLoginHost(config.tech!, config.loginHost),
        };
    }

    toConfiguredConnection(sessionId: SessionId, orgKey: OrgKey, state: string): string {
        const connection = sessions.getUser(sessionId).getConnection(orgKey);
        if (connection) {
            const driver = ConnectionDriverFactory.createDriver(connection.getConnectionDriverConfig());
            return driver.requestAuthorization(state);
        }
        throw new SessionError('Connection not found in workspace');
    }
}

export class RequestedConnectionUseCase implements RequestedConnectionInputPort {
    constructor(private userRepository: UserRepositoryPort) {}
    async exe(sessionId: SessionId | undefined, initialConfigDriverDTO: ConnectionDriverDTO, expectedOrgKey?: OrgKey): Promise<SessionId> {
        const driver = ConnectionDriverFactory.createDriver(initialConfigDriverDTO);
        const configDriverDTO = await driver.login();
        const orgKey = createOrgKey(configDriverDTO.dbId, configDriverDTO.userId);
        if (expectedOrgKey && expectedOrgKey !== orgKey) {
            throw new SessionError('Authenticated Salesforce identity does not match requested connection');
        }
        
        let user: UserEntity;
        if (!sessionId) {
            const userDTO = await this.userRepository.findUserByUserId(configDriverDTO);
            if (userDTO) {
                user = sessions.rebuildUser(userDTO.sessionId, userDTO.expiresAt);
                user.loadConnections(userDTO);
            } else {
                user = sessions.addNewUser();
                await this.userRepository.createUserAndFirstConnection(
                    user.getSessionId(),
                    user.getExpiresAt(),
                    configDriverDTO,
                );
            }
            user.setPendingToUpdate(true);
        } else {
            user = sessions.getUser(sessionId);
            if (!user.checkConnectionExists(orgKey)) {
                const userDTO = await this.userRepository.addNewConnectionToUser(user.getSessionId(), configDriverDTO);
                user.loadConnections(userDTO);
            }
        }

        const rotation = sessions.rotateUserSession(user);
        await this.userRepository.rotateSessionId(
            rotation.previousId,
            rotation.sessionId,
            rotation.expiresAt,
        );
        connectionPool.rotateSession(rotation.previousId, rotation.sessionId);

        if (!user.checkConnectionExists(orgKey)) {
            const userDTO = await this.userRepository.findUserByTokenId(rotation.sessionId);
            user.loadConnections(userDTO);
        }
        user.setActiveOrgKey(orgKey);
        connectionPool.addConnection(rotation.sessionId, orgKey, driver);
        user.setConnectionStatus(orgKey, 'CONNECTED');
        return rotation.sessionId;
    }
}

export class SignOutUseCase implements SignOutInputPort {
    async exe(id: SessionId): Promise<SessionDTO> {
        const user = sessions.lookUpUserOnCache(id);
        if (user) {
            user.signOut();
            sessions.deleteSession(id);
            connectionPool.deleteSession(id);
            return user.getSessionStatus();
        }
        throw new SessionError("Session expired or invalid");
    }
}


