
import { Sessions } from '../../domain/entities/sessions';

import { SessionDTO } from '../../domain/dtos/sessionDTO';
import { SignInInputPort, RequestConnectionInputPort, RequestedConnectionInputPort, SignOutInputPort } from '../../domain/ports/inbound/httpInputPorts';
import { UserRepositoryPort } from '../../domain/ports/outbound/userRepositoryPort';
import { SessionError } from '../../domain/exceptions/sessionError';
import { ConnectionDriverDTO } from '../dtos/connectionDriverDTO';
import { ConnectionRegistryPort } from '../../domain/ports/outbound/connectionRegistryPort';
import { SessionId } from '../../domain/entities/workspaceSession';
import { UserEntity } from '../../domain/entities/UserEntity';
import { createOrgKey, OrgKey } from '../../domain/entities/orgKey';
import { validateSalesforceLoginHost } from '../../domain/entities/salesforceLoginHost';
import { CreateDriver } from '../ports/connectionDriverFactoryPort';


export class SignInUseCase implements SignInInputPort {
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly sessions: Sessions,
        private readonly registry: ConnectionRegistryPort,
    ) {}

    async getSessionStatus(sessionId: SessionId): Promise<SessionDTO> {
        let user = this.sessions.lookUpUserOnCache(sessionId);
        if (user) {
            if (user.getPendingToUpdate()) {
                const userDTO = await this.userRepository.findUserByTokenId(sessionId);
                user.loadConnections(userDTO);
                user.setPendingToUpdate(false);
            }
        } else {
            const userDTO = await this.userRepository.findUserByTokenId(sessionId);
            user = this.sessions.rebuildUser(sessionId, userDTO.expiresAt);
            user.loadConnections(userDTO);
        }
        user.reconcileActiveConnections(new Set(this.registry.listOrgKeys(sessionId)));
        return user.getSessionStatus();
    }
    getStatus(): string {
        return 'ok';
    } 
}

export class RequestConnectionUseCase implements RequestConnectionInputPort {
    constructor(
        private readonly sessions: Sessions,
        private readonly createDriver: CreateDriver,
    ) {}

    toNewConnection(configDriverDTO: ConnectionDriverDTO, state: string): string {
        const driver = this.createDriver(configDriverDTO);
        try {
            return driver.requestAuthorization(state);
        } finally {
            driver.dispose();
        }
    }

    getConfiguredOAuthContext(sessionId: SessionId, orgKey: OrgKey) {
        const config = this.sessions.getUser(sessionId).getConnection(orgKey).getConnectionDriverConfig();
        return {
            technology: config.tech!,
            loginHost: validateSalesforceLoginHost(config.tech!, config.loginHost),
        };
    }

    toConfiguredConnection(sessionId: SessionId, orgKey: OrgKey, state: string): string {
        const connection = this.sessions.getUser(sessionId).getConnection(orgKey);
        const driver = this.createDriver(connection.getConnectionDriverConfig());
        try {
            return driver.requestAuthorization(state);
        } finally {
            driver.dispose();
        }
    }
}

export class RequestedConnectionUseCase implements RequestedConnectionInputPort {
    constructor(
        private readonly userRepository: UserRepositoryPort,
        private readonly sessions: Sessions,
        private readonly registry: ConnectionRegistryPort,
        private readonly createDriver: CreateDriver,
    ) {}
    async exe(sessionId: SessionId | undefined, initialConfigDriverDTO: ConnectionDriverDTO, expectedOrgKey?: OrgKey): Promise<SessionId> {
        const driver = this.createDriver(initialConfigDriverDTO);
        try {
            const configDriverDTO = await driver.login();
            const orgKey = createOrgKey(configDriverDTO.dbId, configDriverDTO.userId);
            if (expectedOrgKey && expectedOrgKey !== orgKey) {
                throw new SessionError('Authenticated Salesforce identity does not match requested connection');
            }

            let user: UserEntity;
            if (!sessionId) {
                const userDTO = await this.userRepository.findUserByUserId(configDriverDTO);
                if (userDTO) {
                    user = this.sessions.rebuildUser(userDTO.sessionId, userDTO.expiresAt);
                    user.loadConnections(userDTO);
                } else {
                    user = this.sessions.addNewUser();
                    await this.userRepository.createUserAndFirstConnection(
                        user.getSessionId(),
                        user.getExpiresAt(),
                        configDriverDTO,
                    );
                }
                user.setPendingToUpdate(true);
            } else {
                user = this.sessions.getUser(sessionId);
                if (!user.checkConnectionExists(orgKey)) {
                    const userDTO = await this.userRepository.addNewConnectionToUser(user.getSessionId(), configDriverDTO);
                    user.loadConnections(userDTO);
                }
            }

            const rotation = this.sessions.rotateUserSession(user);
            await this.userRepository.rotateSessionId(
                rotation.previousId,
                rotation.sessionId,
                rotation.expiresAt,
            );
            this.registry.rotateSession(rotation.previousId, rotation.sessionId, rotation.expiresAt);

            if (!user.checkConnectionExists(orgKey)) {
                const userDTO = await this.userRepository.findUserByTokenId(rotation.sessionId);
                user.loadConnections(userDTO);
            }
            user.setActiveOrgKey(orgKey);
            this.registry.addConnection(rotation.sessionId, orgKey, driver, rotation.expiresAt);
            user.setConnectionStatus(orgKey, 'CONNECTED');
            return rotation.sessionId;
        } catch (error) {
            driver.dispose();
            throw error;
        }
    }
}

export class SignOutUseCase implements SignOutInputPort {
    constructor(private readonly sessions: Sessions, private readonly registry: ConnectionRegistryPort) {}
    async exe(id: SessionId): Promise<SessionDTO> {
        const user = this.sessions.lookUpUserOnCache(id);
        if (user) {
            user.signOut();
            this.sessions.deleteSession(id);
            this.registry.deleteSession(id);
            return user.getSessionStatus();
        }
        throw new SessionError("Session expired or invalid");
    }
}


